/* =========================================================
 * BASE DE DATOS BOTÁNICA — lógica de la aplicación
 *   Inicio   -> especie del día (tarjeta que se gira)
 *   Herbario -> todas las especies con su ficha completa
 *   Jugar    -> Memory y Quiz para estudiar
 * ========================================================= */
(() => {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const mayus = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
  const ls = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const ICONO = {
    volver: `<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>`,
    lupa: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
    info: `<svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>`,
    logo: `<svg viewBox="0 0 48 32"><use href="#i-logo"/></svg>`,
    altavoz: `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
    flecha: `<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`,
    pdf: `<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>`,
    comparar: `<svg viewBox="0 0 24 24"><path d="M8 4v16M16 4v16M3 8h5M16 16h5"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>`,
  };

  /* ---------------- Almacenamiento (IndexedDB) ----------------
   * Un único registro "estado": { especies: {id: especie}, borradas: [id] }
   */
  const DB_NOMBRE = "botanica-db";
  let estado = { especies: {}, borradas: [] };

  function abrirDB() {
    return new Promise((ok, ko) => {
      const req = indexedDB.open(DB_NOMBRE, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("hallazgos")) db.createObjectStore("hallazgos", { keyPath: "id" });
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ko(req.error);
    });
  }
  async function cargarEstado() {
    try {
      const db = await abrirDB();
      const val = await new Promise((ok, ko) => {
        const r = db.transaction("kv").objectStore("kv").get("estado");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ko(r.error);
      });
      if (val) estado = { especies: val.especies || {}, borradas: val.borradas || [] };
    } catch (e) {
      console.warn("No se pudo abrir IndexedDB; los cambios no se guardarán.", e);
    }
  }
  async function guardarEstado() {
    try {
      const db = await abrirDB();
      await new Promise((ok, ko) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(estado, "estado");
        tx.oncomplete = ok;
        tx.onerror = () => ko(tx.error);
      });
    } catch (e) {
      alert("No se han podido guardar los cambios: " + e.message);
    }
  }

  /* Hallazgos: plantas identificadas y guardadas con foto, fecha y lugar */
  async function hallazgosTodos() {
    try {
      const db = await abrirDB();
      const lista = await new Promise((ok, ko) => {
        const r = db.transaction("hallazgos").objectStore("hallazgos").getAll();
        r.onsuccess = () => ok(r.result || []);
        r.onerror = () => ko(r.error);
      });
      return lista.sort((a, b) => b.fecha - a.fecha);
    } catch { return []; }
  }
  async function operarHallazgo(op, valor) {
    const db = await abrirDB();
    await new Promise((ok, ko) => {
      const tx = db.transaction("hallazgos", "readwrite");
      tx.objectStore("hallazgos")[op](valor);
      tx.oncomplete = ok;
      tx.onerror = () => ko(tx.error);
    });
  }

  /* ---------------- Base de datos compartida (Supabase) ----------------
   * Si config.js tiene URL y clave, la tabla "especies" online es la
   * fuente de verdad: todos los dispositivos ven lo mismo. La copia en
   * IndexedDB sirve para abrir la app al instante y sin conexión.
   * Para escribir hace falta la clave de edición (cabecera x-clave-edicion).
   */
  const CFG = window.CONFIG || {};
  const remoto = !!(CFG.SUPABASE_URL && CFG.SUPABASE_KEY);
  const claveGuardada = () => ls.get("claveEdicion", "");

  async function api(ruta, opciones = {}, clave = claveGuardada()) {
    const res = await fetch(CFG.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + ruta, {
      ...opciones,
      headers: {
        apikey: CFG.SUPABASE_KEY,
        Authorization: "Bearer " + CFG.SUPABASE_KEY,
        "Content-Type": "application/json",
        ...(clave ? { "x-clave-edicion": clave } : {}),
        ...(opciones.headers || {}),
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      const err = new Error(txt || res.statusText);
      err.permiso = res.status === 401 || res.status === 403 || /row-level security/i.test(txt);
      throw err;
    }
    return res.status === 204 ? null : res.json().catch(() => null);
  }

  /** Pide la clave de edición (si no está guardada) y la comprueba. */
  async function asegurarClave() {
    if (!remoto) return true;
    if (claveGuardada()) return true;
    const clave = prompt("Introduce la clave de edición para poder añadir o modificar especies:");
    if (!clave) return false;
    try {
      const ok = await api("rpc/clave_valida", { method: "POST", body: "{}" }, clave.trim());
      if (!ok) { alert("La clave no es correcta."); return false; }
      ls.set("claveEdicion", clave.trim());
      return true;
    } catch (e) {
      alert("No se ha podido comprobar la clave (¿hay conexión?).");
      return false;
    }
  }

  async function escribirRemoto(fn) {
    try {
      await fn();
      return true;
    } catch (e) {
      if (e.permiso) { ls.set("claveEdicion", ""); alert("La clave de edición no es válida. Vuelve a introducirla."); }
      else alert("No se ha podido guardar en la base de datos compartida. Comprueba la conexión.\n\n" + e.message);
      return false;
    }
  }

  const fila = (id, datos, borrada = false) => ({ id, datos, borrada, actualizado: new Date().toISOString() });
  const upsert = (filas) => api("especies", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(filas),
  });

  /** Descarga la base de datos compartida y actualiza la copia local. */
  let sincronizando = false;
  async function sincronizar() {
    if (!remoto || sincronizando || !navigator.onLine) return;
    sincronizando = true;
    try {
      const filas = await api("especies?select=id,datos,borrada");
      const nuevo = { especies: {}, borradas: [] };
      for (const f of filas) {
        if (f.borrada) nuevo.borradas.push(f.id);
        else nuevo.especies[f.id] = f.datos;
      }
      if (JSON.stringify(nuevo) !== JSON.stringify(estado)) {
        estado = nuevo;
        await guardarEstado();
        refrescarTodo();
      }
      ls.set("ultimaSync", Date.now());
    } catch (e) {
      console.warn("No se ha podido sincronizar", e);
    } finally {
      sincronizando = false;
      pintarEstadoSync();
    }
  }

  function pintarEstadoSync() {
    const el = $("#estado-sync");
    if (!el) return;
    if (!remoto) { el.textContent = "Datos guardados solo en este dispositivo"; return; }
    const t = ls.get("ultimaSync", 0);
    el.textContent = t ? `Sincronizado ${new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Sin sincronizar todavía";
  }

  /* Operaciones de escritura (online si hay base compartida, local si no) */
  async function guardarEspecie(especie) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      if (!(await escribirRemoto(() => upsert([fila(especie.id, especie)])))) return false;
    }
    estado.especies[especie.id] = especie;
    estado.borradas = estado.borradas.filter((b) => b !== especie.id);
    await guardarEstado();
    return true;
  }
  async function borrarEspecie(id) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      const ok = await escribirRemoto(() => baseIds.has(id)
        ? upsert([fila(id, { id }, true)])
        : api("especies?id=eq." + encodeURIComponent(id), { method: "DELETE" }));
      if (!ok) return false;
    }
    if (baseIds.has(id) && !estado.borradas.includes(id)) estado.borradas.push(id);
    delete estado.especies[id];
    await guardarEstado();
    return true;
  }
  async function restaurarEspecie(id) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      if (!(await escribirRemoto(() => api("especies?id=eq." + encodeURIComponent(id), { method: "DELETE" })))) return false;
    }
    delete estado.especies[id];
    estado.borradas = estado.borradas.filter((b) => b !== id);
    await guardarEstado();
    return true;
  }
  async function importarEspecies(lista) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      if (!(await escribirRemoto(() => upsert(lista.map((e) => fila(e.id, e)))))) return false;
    }
    for (const e of lista) {
      estado.especies[e.id] = e;
      estado.borradas = estado.borradas.filter((b) => b !== e.id);
    }
    await guardarEstado();
    return true;
  }

  /* ---------------- Datos combinados ---------------- */
  const baseIds = new Set(window.ESPECIES_BASE.map((e) => e.id));
  function todasLasEspecies() {
    const lista = [];
    for (const b of window.ESPECIES_BASE) {
      if (estado.borradas.includes(b.id)) continue;
      lista.push(estado.especies[b.id] || b);
    }
    for (const [id, e] of Object.entries(estado.especies)) if (!baseIds.has(id)) lista.push(e);
    return lista;
  }
  const porId = (id) => todasLasEspecies().find((e) => e.id === id);
  const porLatin = (lat) => todasLasEspecies().find((e) => norm(e.nombres.lat) === norm(lat));
  const grupos = () => [...new Set(todasLasEspecies().map((e) => e.grupo).filter(Boolean))];

  /* ---------------- Fotos ---------------- */
  function htmlFoto(e, tipo, alt = "") {
    const src = e.fotos?.[tipo];
    return `<figure class="foto${src ? "" : " sin-foto"}"><img ${src ? `src="${esc(src)}"` : ""} alt="${esc(alt)}" loading="lazy" onerror="this.parentNode.classList.add('sin-foto')"></figure>`;
  }
  function htmlCredito(e, tipo) {
    const c = e.creditos?.[tipo];
    if (!c) return e.fotos?.[tipo]?.startsWith("img/") ? `<div class="credito">Foto del recull</div>` : "";
    return `<div class="credito">Foto: ${esc(c.autor)} · ${esc(c.licencia)} · <a href="${esc(c.url)}" target="_blank" rel="noopener">Wikimedia Commons</a></div>`;
  }

  /* ---------------- Navegación entre vistas ---------------- */
  function irA(vista) {
    $$(".vista").forEach((v) => (v.hidden = v.id !== "vista-" + vista));
    $$("#navegacion button").forEach((b) => b.classList.toggle("activo", b.dataset.vista === vista));
    if (vista === "jugar") menuJuegos();
    if (vista === "identifica") renderHallazgos();
    window.scrollTo(0, 0);
    ls.set("vista", vista);
  }
  $("#navegacion").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-vista]");
    if (b) irA(b.dataset.vista);
  });

  /* =========================================================
   * PROGRESO — qué especies te sabes y racha de días estudiando
   *   progreso: { id: { a: aciertos, f: fallos, u: acertó la última } }
   *   diasEstudio: [número de día, ...]
   * ========================================================= */
  const progreso = () => ls.get("progreso", {});
  function registrarRespuesta(id, bien) {
    const p = progreso();
    const r = p[id] || { a: 0, f: 0, u: false };
    if (bien) r.a++; else r.f++;
    r.u = bien;
    p[id] = r;
    ls.set("progreso", p);
    marcarDiaEstudio();
  }
  function estaSabida(id) {
    const r = progreso()[id];
    return !!r && r.a >= 2 && r.u;
  }
  function marcarDiaEstudio() {
    const dias = ls.get("diasEstudio", []);
    const hoy = numeroDeDia();
    if (!dias.includes(hoy)) { dias.push(hoy); ls.set("diasEstudio", dias.slice(-400)); }
    renderProgreso();
  }
  function racha() {
    const dias = new Set(ls.get("diasEstudio", []));
    let d = numeroDeDia();
    if (!dias.has(d)) d--; // si hoy aún no ha estudiado, la racha de ayer sigue viva
    let n = 0;
    while (dias.has(d)) { n++; d--; }
    return n;
  }
  function renderProgreso() {
    const cont = $("#progreso");
    if (!cont) return;
    const lista = todasLasEspecies();
    const sabidas = lista.filter((e) => estaSabida(e.id)).length;
    const r = racha();
    const estudiadoHoy = ls.get("diasEstudio", []).includes(numeroDeDia());
    cont.innerHTML = `
      <div class="progreso-tarjeta">
        <div class="progreso-cifras">
          <div><b>${sabidas}<small>/${lista.length}</small></b><span>especies que te sabes</span></div>
          <div><b>${r}</b><span>${r === 1 ? "día" : "días"} de racha${estudiadoHoy ? "" : r ? " · ¡estudia hoy!" : ""}</span></div>
        </div>
        <div class="progreso"><div style="width:${lista.length ? (sabidas / lista.length) * 100 : 0}%"></div></div>
        <p>${sabidas === lista.length && lista.length ? "¡Te las sabes todas!" : "Una especie cuenta como sabida cuando la aciertas 2 veces en los juegos (y la última vez, bien)."}</p>
      </div>`;
  }

  /* =========================================================
   * INICIO — especie del día
   * ========================================================= */
  // Orden barajado con semilla: todas las especies salen antes de repetir.
  function barajarConSemilla(arr, semilla) {
    const a = [...arr];
    let s = semilla * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function numeroDeDia(fecha = new Date()) {
    return Math.floor(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) / 86400000);
  }
  function especieDelDia() {
    const lista = todasLasEspecies().sort((a, b) => a.id.localeCompare(b.id));
    if (!lista.length) return null;
    const dia = numeroDeDia();
    const ciclo = Math.floor(dia / lista.length);
    return barajarConSemilla(lista, ciclo)[dia % lista.length];
  }

  function renderInicio() {
    const hoy = new Date();
    $("#hoy").textContent = hoy.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const e = especieDelDia();
    const giro = $("#giro");
    if (!e) { giro.hidden = true; return; }
    giro.hidden = false;

    const frente = $(".cara-frente", giro);
    const img = $("img", frente);
    img.src = e.fotos?.planta || e.fotos?.hoja || "";
    $(".foto", frente).classList.toggle("sin-foto", !img.getAttribute("src"));
    $("#pista").textContent = `Pista: es de ${e.grupo ? e.grupo.toLowerCase() : "la base de datos"}${e.tipoHoja ? ", hoja " + e.tipoHoja : ""}.`;

    $("#respuesta").innerHTML = `
      <p class="etiqueta">La respuesta es…</p>
      <h2>${esc(e.nombres.ca)}</h2>
      <p class="sub">${esc(e.nombres.es)} · <i>${esc(e.nombres.lat)}</i></p>
      <div class="dorso-fotos">
        <div>${htmlFoto(e, "planta", "Planta entera")}<figcaption>Planta entera</figcaption></div>
        <div>${htmlFoto(e, "hoja", "Hoja")}<figcaption>Hoja</figcaption></div>
      </div>
      <p class="dorso-clave"><b>Clave para reconocerla</b>${esc(e.identificacion?.[0] || e.descripcion || "")}</p>
      <div class="dorso-botones">
        <button class="btn claro" data-accion="girar">Volver a girar</button>
        <button class="btn" data-accion="ficha">Ver ficha</button>
      </div>`;

    // ¿Ya se ha girado hoy? Recordarlo.
    const girada = ls.get("giradaDia") === numeroDeDia();
    giro.classList.toggle("girada", girada);

    // Cuenta atrás hasta la próxima especie
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    const min = Math.round((manana - hoy) / 60000);
    $("#nota-dia").textContent = `Nueva especie en ${Math.floor(min / 60)} h ${min % 60} min`;
  }

  function girarTarjeta() {
    const giro = $("#giro");
    giro.classList.toggle("girada");
    ls.set("giradaDia", giro.classList.contains("girada") ? numeroDeDia() : null);
    if (giro.classList.contains("girada")) marcarDiaEstudio();
  }
  $("#giro").addEventListener("click", (ev) => {
    const acc = ev.target.closest("[data-accion]");
    if (acc?.dataset.accion === "ficha") { abrirFicha(especieDelDia().id); return; }
    if (acc?.dataset.accion === "girar" || ev.target.closest(".cara-frente")) girarTarjeta();
  });

  /* =========================================================
   * HERBARIO
   * ========================================================= */
  const filtros = { grupo: "", tipoHoja: "", follaje: "", autoctona: false };
  const inpBuscar = $("#buscar");

  function renderChipsGrupo() {
    const gs = grupos();
    if (!gs.includes(filtros.grupo)) filtros.grupo = "";
    $("#f-grupo").innerHTML = [["", "Todas"], ...gs.map((g) => [g, g])]
      .map(([v, t]) => `<button data-v="${esc(v)}" class="${filtros.grupo === v ? "activo" : ""}">${esc(t)}</button>`).join("");
  }
  $("#f-grupo").addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    filtros.grupo = b.dataset.v;
    renderChipsGrupo();
    renderHerbario();
  });

  // Popover de filtros compacto
  const pop = $("#pop-filtros");
  $("#btn-filtros").addEventListener("click", (ev) => { ev.stopPropagation(); pop.hidden = !pop.hidden; $("#menu").hidden = true; });
  pop.addEventListener("click", (ev) => ev.stopPropagation());
  $("#f-hoja").addEventListener("change", (ev) => { filtros.tipoHoja = ev.target.value; renderHerbario(); });
  $("#f-follaje").addEventListener("change", (ev) => { filtros.follaje = ev.target.value; renderHerbario(); });
  $("#f-autoctona").addEventListener("change", (ev) => { filtros.autoctona = ev.target.checked; renderHerbario(); });
  $("#btn-limpiar").addEventListener("click", () => {
    filtros.tipoHoja = filtros.follaje = ""; filtros.autoctona = false;
    $("#f-hoja").value = $("#f-follaje").value = ""; $("#f-autoctona").checked = false;
    renderHerbario();
  });

  // Menú (nueva especie, exportar, importar)
  $("#btn-menu").addEventListener("click", (ev) => { ev.stopPropagation(); $("#menu").hidden = !$("#menu").hidden; pop.hidden = true; });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest("#menu")) $("#menu").hidden = true;
    if (!ev.target.closest(".filtros-envoltorio")) pop.hidden = true;
  });
  inpBuscar.addEventListener("input", () => renderHerbario());

  function textoBusqueda(e) {
    return norm([
      e.nombres.ca, e.nombres.es, e.nombres.lat, e.otrosNombres, e.grupo, e.familia, e.origen, e.tipoHoja, e.follaje, e.trepa,
      e.descripcion, ...(e.identificacion || []), ...Object.values(e.ficha || {}),
    ].join(" "));
  }

  function renderHerbario() {
    const n = [filtros.tipoHoja, filtros.follaje, filtros.autoctona].filter(Boolean).length;
    $("#n-filtros").hidden = !n;
    $("#n-filtros").textContent = n;

    const terminos = norm(inpBuscar.value).trim().split(/\s+/).filter(Boolean);
    const lista = todasLasEspecies().filter((e) =>
      (!filtros.grupo || e.grupo === filtros.grupo) &&
      (!filtros.tipoHoja || e.tipoHoja === filtros.tipoHoja) &&
      (!filtros.follaje || e.follaje === filtros.follaje) &&
      (!filtros.autoctona || e.autoctona) &&
      terminos.every((t) => textoBusqueda(e).includes(t))
    );

    const cont = $("#lista");
    if (!lista.length) { cont.innerHTML = `<p class="vacio">No hay especies que coincidan.</p>`; return; }

    const porGrupo = {};
    lista.forEach((e) => (porGrupo[e.grupo || "Sin grupo"] ||= []).push(e));
    cont.innerHTML = Object.entries(porGrupo).map(([g, es]) => `
      <section class="grupo-lista">
        <h2>${esc(g)} <small>${es.length} especie${es.length === 1 ? "" : "s"}</small></h2>
        <div class="rejilla-plantas">
          ${es.map((e) => `
            <article class="planta" data-id="${esc(e.id)}" tabindex="0">
              ${estaSabida(e.id) ? `<span class="marca-sabida" title="Te la sabes">${ICONO.check}</span>` : ""}
              ${htmlFoto(e, "planta", e.nombres.lat)}
              <h3>${esc(e.nombres.ca)}</h3>
              <p>${esc(e.nombres.es)}</p>
              <p class="lat">${esc(e.nombres.lat)}</p>
            </article>`).join("")}
        </div>
      </section>`).join("");
  }
  $("#lista").addEventListener("click", (ev) => { const t = ev.target.closest(".planta"); if (t) abrirFicha(t.dataset.id); });
  $("#lista").addEventListener("keydown", (ev) => { const t = ev.target.closest(".planta"); if (t && ev.key === "Enter") abrirFicha(t.dataset.id); });

  /* ---------------- Ficha de detalle ---------------- */
  const dlgFicha = $("#dlg-ficha");
  const TIPOS_FOTO = [["planta", "Planta entera"], ["hoja", "Hoja"], ["flor", "Flor"], ["fruto", "Fruto"], ["tronco", "Tronco / tallo"]];
  const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function cifraAltura(t) {
    const m = String(t || "").match(/(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?)\s*m\b/);
    return m ? m[1].replace(/\s/g, "") : "";
  }
  function cifraFrio(t) {
    const nums = [...String(t || "").matchAll(/[−-]\s*(\d+)/g)].map((m) => +m[1]);
    return nums.length ? "−" + Math.max(...nums) : "";
  }

  /* Pronunciación con la voz del sistema */
  const IDIOMA_VOZ = { ca: "ca-ES", es: "es-ES", lat: "es-ES" };
  function hablar(texto, idioma) {
    if (!("speechSynthesis" in window)) { alert("Este dispositivo no puede leer en voz alta."); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = IDIOMA_VOZ[idioma] || "es-ES";
    const voz = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(u.lang.slice(0, 2)));
    if (voz) u.voice = voz;
    u.rate = idioma === "lat" ? 0.8 : 0.95;
    speechSynthesis.speak(u);
  }
  const botonVoz = (texto, idioma, etiqueta) =>
    `<button class="voz" data-voz="${esc(texto)}" data-idioma="${idioma}" aria-label="Escuchar ${esc(etiqueta)}" title="Escuchar">${ICONO.altavoz}</button>`;

  /* Calendario de 12 meses */
  function htmlCalendario(cal) {
    if (!cal) return "";
    const filas = [["flor", "Floración"], ["fruto", "Fruto"], ["poda", "Poda"]].filter(([k]) => cal[k]?.length);
    if (!filas.length) return "";
    const mesActual = new Date().getMonth() + 1;
    return `
      <div class="calendario">
        <div class="cal-fila cal-meses"><span></span>${MESES.map((m, i) => `<i class="${i + 1 === mesActual ? "hoy" : ""}">${m}</i>`).join("")}</div>
        ${filas.map(([k, t]) => `
          <div class="cal-fila"><span>${t}</span>${MESES.map((_, i) => `<i class="${cal[k].includes(i + 1) ? "on " + k : ""}" title="${cal[k].includes(i + 1) ? t + " en " + MESES_LARGOS[i] : ""}"></i>`).join("")}</div>`).join("")}
      </div>`;
  }

  /* Secciones de la ficha: se usan en la app (desplegables) y en el PDF */
  function seccionesFicha(e, paraPdf = false) {
    const f = e.ficha || {};
    const G = window.GLOSARIO || {};
    const j = e.jardineria || {};
    const fila = (k, v) => (v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "");
    const lista = (arr, cls = "lista-simple") => (arr?.length ? `<ul class="${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
    const fotos = TIPOS_FOTO.filter(([t]) => e.fotos?.[t] && t !== "planta" && t !== "hoja");
    const secciones = [
      { id: "descripcion", titulo: "Descripción", html: `<p>${esc(e.descripcion)}</p>` },
      { id: "identificacion", titulo: "Cómo identificarla", html: lista(e.identificacion, "clave") },
      !paraPdf && fotos.length && {
        id: "galeria", titulo: `Más fotos <small>${fotos.map(([, t]) => t.toLowerCase()).join(", ")}</small>`,
        html: `<div class="galeria">${fotos.map(([t, n]) => `
          <figure><div data-zoom>${htmlFoto(e, t, n)}</div><figcaption>${n}</figcaption>${htmlCredito(e, t)}</figure>`).join("")}</div>`,
      },
      e.confusion?.length && {
        id: "confusion", titulo: "No confundir con",
        html: `<ul class="lista-conf">${e.confusion.map((c) => {
          const otra = porId(c.id);
          if (!otra) return `<li><i>${esc(c.id)}</i>: ${esc(c.diferencia)}</li>`;
          return `<li>
            <div><b>${paraPdf ? esc(otra.nombres.ca) : `<a href="#" data-ir="${esc(otra.id)}">${esc(otra.nombres.ca)}</a>`}</b> <i>(${esc(otra.nombres.lat)})</i><br>${esc(c.diferencia)}</div>
            ${paraPdf ? "" : `<button class="btn mini" data-comparar="${esc(otra.id)}">${ICONO.comparar} Comparar</button>`}
          </li>`;
        }).join("")}</ul>`,
      },
      e.calendario && { id: "calendario", titulo: "Calendario", html: htmlCalendario(e.calendario) },
      Object.keys(j).length && {
        id: "jardineria", titulo: "Jardinería",
        html: `<dl class="tabla">${fila("Exposición", j.exposicion)}${fila("Riego", j.riego)}${fila("Suelo", j.suelo)}${fila("Poda", j.poda)}${fila("Plagas y problemas", j.plagas)}${fila("Usos", e.usos)}</dl>`,
      },
      {
        id: "ficha", titulo: "Ficha técnica",
        html: `<dl class="tabla">
          ${fila("Nombre científico", e.nombres.lat)}${fila("Catalán", e.nombres.ca)}${fila("Castellano", e.nombres.es)}
          ${fila("Otros nombres", e.otrosNombres)}${fila("Grupo", e.grupo)}${fila("Familia", e.familia)}
          ${fila("Tipo de hoja", e.tipoHoja ? mayus(e.tipoHoja) + (G[e.tipoHoja] ? ". " + G[e.tipoHoja] : "") : "")}
          ${fila("Follaje", mayus(e.follaje))}${fila("Cómo trepa", e.trepa)}${fila("Tronco / tallos", f.tronco || e.tronco)}
          ${fila("Hojas", f.hojas)}${fila("Flores", f.flores)}${fila("Fruto", f.fruto)}
          ${fila("Altura", e.altura)}${fila("Origen", e.origen)}${fila("Autóctona", e.autoctona ? "Sí" : "No")}
          ${fila("Resistencia al frío", e.rusticidad)}
        </dl>`,
      },
      e.curiosidades?.length && { id: "curiosidades", titulo: "Curiosidades", html: lista(e.curiosidades) },
    ];
    return secciones.filter(Boolean);
  }

  // Qué apartados están desplegados (se recuerda entre fichas)
  const abiertasPorDefecto = ["descripcion", "identificacion"];
  const seccionesAbiertas = () => ls.get("seccionesAbiertas", abiertasPorDefecto);

  function abrirFicha(id) {
    const e = porId(id);
    if (!e) return;
    const alt = cifraAltura(e.altura);
    const frio = cifraFrio(e.rusticidad);
    const editada = estado.especies[e.id] && baseIds.has(e.id);
    const abiertas = seccionesAbiertas();
    const sabida = estaSabida(e.id);

    const stats = [
      alt && `<li><b>${esc(alt)}<sup>m</sup></b><span>Altura</span></li>`,
      frio && `<li><b>${esc(frio)}<sup>°C</sup></b><span>Resistencia al frío</span></li>`,
      e.tipoHoja && `<li><b>${esc(mayus(e.tipoHoja))}</b><span>Hoja${e.follaje ? " " + esc(e.follaje === "caduco" ? "caduca" : "perenne") : ""}</span></li>`,
    ].filter(Boolean).join("");

    dlgFicha.innerHTML = `
      <div class="ficha-cab">
        <button class="volver" data-cerrar>${ICONO.volver} Volver</button>
        <span class="botones-cab">
          <button class="pastilla" data-pdf>${ICONO.pdf} PDF</button>
          <button class="pastilla" data-editar>Editar</button>
        </span>
      </div>
      <section class="hero">
        <div>
          <div data-zoom>${htmlFoto(e, "planta", "Planta entera de " + e.nombres.lat)}</div>
          ${htmlCredito(e, "planta")}
        </div>
        <div>
          ${sabida ? `<span class="sello si mini">${ICONO.check} Te la sabes</span>` : ""}
          <h2>${esc(e.nombres.ca)} ${botonVoz(e.nombres.ca, "ca", "el nombre en catalán")}</h2>
          <p class="sub">${esc(e.nombres.es)} ${botonVoz(e.nombres.es, "es", "el nombre en castellano")}</p>
          <p class="sub"><i>${esc(e.nombres.lat)}</i> ${botonVoz(e.nombres.lat, "lat", "el nombre científico")}</p>
          <p class="grupo">${esc([e.grupo, e.familia].filter(Boolean).join(" · "))}</p>
          <ul class="stats">${stats}</ul>
        </div>
      </section>
      <section class="panel">
        <div class="panel-top">
          <div>
            <div data-zoom>${htmlFoto(e, "hoja", "Hoja de " + e.nombres.lat)}</div>
            <p class="pie-foto">Hoja</p>
            ${htmlCredito(e, "hoja").replace('class="credito"', 'class="credito pie-foto"')}
          </div>
          <div class="aviso">
            <strong>Clave rápida</strong>
            <p>${esc(e.identificacion?.[0] || e.descripcion || "")}</p>
          </div>
        </div>
        <div class="acordeones">
          <div class="acordeon-controles">
            <button class="enlace" data-todas="1">Desplegar todo</button>
            <button class="enlace" data-todas="0">Plegar todo</button>
          </div>
          ${seccionesFicha(e).map((s) => `
            <details class="acordeon" data-sec="${s.id}" ${abiertas.includes(s.id) ? "open" : ""}>
              <summary><span>${s.titulo}</span>${ICONO.flecha}</summary>
              <div class="acordeon-cuerpo">${s.html}</div>
            </details>`).join("")}
        </div>
        <div class="acciones-ficha">
          <span class="fuente">${{ curso: "Especie del recull del curso", usuario: "Especie creada por ti" }[e.fuente] || ""}${editada ? " · editada" : ""}</span>
          <span class="botones">
            ${editada ? `<button class="btn" data-restaurar>Restaurar original</button>` : ""}
            <button class="btn peligro" data-borrar>Eliminar</button>
          </span>
        </div>
      </section>`;

    // Recordar qué apartados se despliegan
    $$("details.acordeon", dlgFicha).forEach((d) => d.addEventListener("toggle", () => {
      ls.set("seccionesAbiertas", $$("details.acordeon[open]", dlgFicha).map((x) => x.dataset.sec));
    }));

    dlgFicha.onclick = async (ev) => {
      const t = ev.target;
      if (t.closest("[data-cerrar]")) dlgFicha.close();
      else if (t.closest("[data-voz]")) { const b = t.closest("[data-voz]"); hablar(b.dataset.voz, b.dataset.idioma); }
      else if (t.closest("[data-zoom] img")) verFoto(t.closest("img").src);
      else if (t.closest("[data-todas]")) {
        const abrir = t.closest("[data-todas]").dataset.todas === "1";
        $$("details.acordeon", dlgFicha).forEach((d) => (d.open = abrir));
      }
      else if (t.closest("[data-comparar]")) abrirComparador(e.id, t.closest("[data-comparar]").dataset.comparar);
      else if (t.closest("[data-pdf]")) imprimirFicha(e);
      else if (t.closest("[data-ir]")) { ev.preventDefault(); abrirFicha(t.closest("[data-ir]").dataset.ir); dlgFicha.scrollTop = 0; }
      else if (t.closest("[data-editar]")) {
        if (!(await asegurarClave())) return;
        dlgFicha.close(); abrirFormulario(e.id);
      }
      else if (t.closest("[data-borrar]")) {
        if (!confirm(`¿Eliminar «${e.nombres.ca}» de la base de datos${remoto ? " para todos los dispositivos" : ""}?`)) return;
        if (!(await borrarEspecie(e.id))) return;
        dlgFicha.close(); refrescarTodo();
      }
      else if (t.closest("[data-restaurar]")) {
        if (!confirm("¿Descartar los cambios y volver a los datos originales?")) return;
        if (!(await restaurarEspecie(e.id))) return;
        abrirFicha(e.id); refrescarTodo();
      }
    };

    if (!dlgFicha.open) { dlgFicha.showModal(); dlgFicha.scrollTop = 0; }
  }

  /* ---------------- Comparador de especies ---------------- */
  const dlgComparar = $("#dlg-comparar");
  function abrirComparador(idA, idB) {
    const a = porId(idA), b = porId(idB);
    if (!a || !b) return;
    const todas = todasLasEspecies();
    const selector = (actual, lado) => `
      <select data-lado="${lado}">${todas.map((x) => `<option value="${esc(x.id)}" ${x.id === actual ? "selected" : ""}>${esc(x.nombres.ca)}</option>`).join("")}</select>`;
    const dif = (a.confusion || []).find((c) => c.id === b.id)?.diferencia || (b.confusion || []).find((c) => c.id === a.id)?.diferencia;
    const col = (e) => e.jardineria || {};
    const filas = [
      ["Nombre científico", (e) => `<i>${esc(e.nombres.lat)}</i>`],
      ["Castellano", (e) => esc(e.nombres.es)],
      ["Familia", (e) => esc(e.familia)],
      ["Tipo de hoja", (e) => esc(mayus(e.tipoHoja))],
      ["Follaje", (e) => esc(mayus(e.follaje))],
      ["Tronco / tallos", (e) => esc(e.ficha?.tronco || e.tronco)],
      ["Hojas", (e) => esc(e.ficha?.hojas)],
      ["Fruto", (e) => esc(e.ficha?.fruto)],
      ["Altura", (e) => esc(e.altura)],
      ["Frío", (e) => esc(e.rusticidad)],
      ["Origen", (e) => esc(e.origen)],
      ["Exposición", (e) => esc(col(e).exposicion)],
    ];
    dlgComparar.innerHTML = `
      <div class="ficha-cab oscuro">
        <button class="volver" data-cerrar>${ICONO.volver} Volver</button>
        <strong>Comparar</strong>
        <span style="width:70px"></span>
      </div>
      <div class="comparador">
        <div class="comp-cols">
          ${[a, b].map((e, i) => `
            <div class="comp-col">
              ${selector(e.id, i)}
              <div data-zoom>${htmlFoto(e, "planta", e.nombres.ca)}</div>
              <div data-zoom>${htmlFoto(e, "hoja", "Hoja")}</div>
              <h3>${esc(e.nombres.ca)}</h3>
            </div>`).join("")}
        </div>
        ${dif ? `<div class="comp-dif"><strong>La diferencia clave</strong><p>${esc(dif)}</p></div>` : ""}
        <div class="comp-tabla">
          ${filas.map(([t, fn]) => `<div class="comp-fila"><span class="comp-t">${t}</span><div>${fn(a) || "—"}</div><div>${fn(b) || "—"}</div></div>`).join("")}
          <div class="comp-fila"><span class="comp-t">Cómo reconocerla</span>
            ${[a, b].map((e) => `<div><ul>${(e.identificacion || []).slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
          </div>
        </div>
      </div>`;
    dlgComparar.onclick = (ev) => {
      if (ev.target.closest("[data-cerrar]")) dlgComparar.close();
      else if (ev.target.closest("[data-zoom] img")) verFoto(ev.target.closest("img").src);
    };
    dlgComparar.onchange = (ev) => {
      const s = ev.target.closest("select[data-lado]");
      if (!s) return;
      const ids = $$("select[data-lado]", dlgComparar).map((x) => x.value);
      abrirComparador(ids[0], ids[1]);
    };
    if (!dlgComparar.open) dlgComparar.showModal();
    dlgComparar.scrollTop = 0;
  }

  /* ---------------- Exportar ficha a PDF (imprimir) ---------------- */
  function imprimirFicha(e) {
    const zona = $("#impresion");
    const fotos = TIPOS_FOTO.filter(([t]) => e.fotos?.[t]);
    zona.innerHTML = `
      <article class="pdf">
        <header>
          <p class="pdf-grupo">${esc([e.grupo, e.familia].filter(Boolean).join(" · "))}</p>
          <h1>${esc(e.nombres.ca)}</h1>
          <p class="pdf-sub">${esc(e.nombres.es)} · <i>${esc(e.nombres.lat)}</i></p>
        </header>
        <div class="pdf-fotos">${fotos.map(([t, n]) => `<figure><img src="${esc(e.fotos[t])}" alt=""><figcaption>${n}</figcaption></figure>`).join("")}</div>
        ${seccionesFicha(e, true).map((s) => `<section><h2>${s.titulo}</h2>${s.html}</section>`).join("")}
        <footer>Herbario · Base de datos botánica — ${new Date().toLocaleDateString("es-ES")}</footer>
      </article>`;
    const imgs = $$("img", zona);
    Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))))
      .then(() => {
        document.title = `${e.nombres.ca} - ficha`;
        window.print();
        document.title = "Herbario · Base de datos botánica";
      });
  }
  window.addEventListener("afterprint", () => { $("#impresion").innerHTML = ""; });

  const dlgFoto = $("#dlg-foto");
  function verFoto(src) {
    if (!src) return;
    $("img", dlgFoto).src = src;
    dlgFoto.showModal();
  }
  dlgFoto.addEventListener("click", () => dlgFoto.close());

  /* =========================================================
   * JUGAR — Memory y Quiz
   * ========================================================= */
  const juego = $("#juego");
  const btnSalir = $("#btn-salir-juego");
  let temporizador = null;
  const pararTemporizador = () => { clearInterval(temporizador); temporizador = null; };
  const barajar = (a) => barajarConSemilla(a, Math.floor(Math.random() * 1e6));
  btnSalir.addEventListener("click", () => menuJuegos());

  function cabeceraJuego(visible) {
    btnSalir.hidden = !visible;
    $("#hueco-juego").hidden = visible;
  }

  function menuJuegos() {
    pararTemporizador();
    cabeceraJuego(false);
    const recMemory = ls.get("recordMemory", null);
    const recQuiz = ls.get("recordQuiz", null);
    juego.innerHTML = `
      <header class="titulo"><h1>Jugar</h1></header>
      <div class="juegos">
        <button class="juego-tarjeta verde" data-juego="memory">
          <h2>Memory</h2>
          <p>Empareja cada foto con su nombre.</p>
          <p class="record">${recMemory ? `Récord: ${recMemory.movimientos} movimientos · ${recMemory.tiempo}` : "Aún sin récord"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
        <button class="juego-tarjeta" data-juego="quiz">
          <h2>Quiz</h2>
          <p>¿Qué especie es? 10 preguntas con fotos de planta y hoja.</p>
          <p class="record">${recQuiz != null ? `Mejor puntuación: ${recQuiz}/10` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
        <button class="juego-tarjeta verde" data-juego="vf">
          <h2>¿Verdadero o falso?</h2>
          <p>10 afirmaciones sobre los rasgos de cada especie.</p>
          <p class="record">${ls.get("recordVF", null) != null ? `Mejor puntuación: ${ls.get("recordVF")}/10` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
        <button class="juego-tarjeta" data-juego="ordena">
          <h2>Ordena</h2>
          <p>Ordena especies por altura o por resistencia al frío.</p>
          <p class="record">${ls.get("recordOrdena", null) != null ? `Mejor puntuación: ${ls.get("recordOrdena")}/5` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
      </div>`;
    juego.onclick = (ev) => {
      const b = ev.target.closest("[data-juego]");
      if (b) ({ memory: opcionesMemory, quiz: opcionesQuiz, vf: opcionesVF, ordena: opcionesOrdena })[b.dataset.juego]();
    };
  }

  /* ---------- Opciones comunes: grupo ---------- */
  const opcionesGuardadas = ls.get("opcionesJuego", { grupo: "", modo: "foto-ca" });
  function chipsOpcion(nombre, valores, actual) {
    return `<div class="chips" data-opcion="${nombre}">${valores.map(([v, t]) => `<button data-v="${esc(v)}" class="${v === actual ? "activo" : ""}">${esc(t)}</button>`).join("")}</div>`;
  }
  function especiesDeGrupo(g) { return todasLasEspecies().filter((e) => !g || e.grupo === g); }

  function pantallaOpciones(titulo, extra, alEmpezar) {
    cabeceraJuego(true);
    juego.innerHTML = `
      <header class="titulo"><h1>${titulo}</h1></header>
      <div class="juegos">
        <div class="opciones-juego">
          <div><span>Especies</span>${chipsOpcion("grupo", [["", "Todas"], ...grupos().map((g) => [g, g])], opcionesGuardadas.grupo)}</div>
          ${extra}
        </div>
        <button class="btn principal" data-empezar>Empezar</button>
      </div>`;
    juego.onclick = (ev) => {
      const b = ev.target.closest("[data-opcion] button");
      if (b) {
        const op = b.parentElement.dataset.opcion;
        opcionesGuardadas[op] = b.dataset.v;
        ls.set("opcionesJuego", opcionesGuardadas);
        $$("button", b.parentElement).forEach((x) => x.classList.toggle("activo", x === b));
      }
      if (ev.target.closest("[data-empezar]")) alEmpezar();
    };
  }

  /* ---------- MEMORY ---------- */
  const MODOS_MEMORY = [
    ["foto-ca", "Foto ↔ catalán"],
    ["foto-es", "Foto ↔ castellano"],
    ["foto-lat", "Foto ↔ científico"],
    ["hoja-ca", "Hoja ↔ catalán"],
  ];
  function opcionesMemory() {
    if (!MODOS_MEMORY.some(([m]) => m === opcionesGuardadas.modo)) opcionesGuardadas.modo = "foto-ca";
    pantallaOpciones("Memory", `<div><span>Modo</span>${chipsOpcion("modo", MODOS_MEMORY, opcionesGuardadas.modo)}</div>`, empezarMemory);
  }

  function empezarMemory() {
    const [tipoFoto, idioma] = opcionesGuardadas.modo.split("-");
    const tipo = tipoFoto === "hoja" ? "hoja" : "planta";
    const disponibles = especiesDeGrupo(opcionesGuardadas.grupo).filter((e) => e.fotos?.[tipo]);
    const pares = barajar(disponibles).slice(0, 6);
    if (pares.length < 2) { alert("No hay suficientes especies con foto para jugar."); return; }

    const cartas = barajar(pares.flatMap((e) => [
      { id: e.id, cara: `<div class="carta-anverso con-foto">${htmlFoto(e, tipo, "")}</div>` },
      { id: e.id, cara: `<div class="carta-anverso">${idioma === "lat" ? `<i>${esc(e.nombres.lat)}</i>` : esc(e.nombres[idioma])}</div>` },
    ]));

    let movimientos = 0, aciertos = 0, abiertas = [], bloqueado = false, inicio = Date.now();
    const tiempo = () => { const s = Math.floor((Date.now() - inicio) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

    cabeceraJuego(true);
    juego.innerHTML = `
      <div class="marcador">
        <div><b id="m-mov">0</b><span>Movimientos</span></div>
        <div><b id="m-par">0/${pares.length}</b><span>Parejas</span></div>
        <div><b id="m-tiempo">0:00</b><span>Tiempo</span></div>
      </div>
      <div class="tablero">
        ${cartas.map((c, i) => `
          <div class="carta" data-i="${i}" tabindex="0" role="button" aria-label="Carta">
            <div class="carta-interior">
              <div class="carta-lado carta-reverso">${ICONO.logo}</div>
              <div class="carta-lado" style="transform:rotateY(180deg)">${c.cara}</div>
            </div>
          </div>`).join("")}
      </div>`;
    pararTemporizador();
    temporizador = setInterval(() => { const el = $("#m-tiempo"); if (el) el.textContent = tiempo(); }, 1000);

    const girar = (carta) => {
      if (bloqueado || carta.classList.contains("vuelta") || carta.classList.contains("hecha")) return;
      carta.classList.add("vuelta");
      abiertas.push(carta);
      if (abiertas.length < 2) return;
      movimientos++;
      $("#m-mov").textContent = movimientos;
      const [a, b] = abiertas;
      if (cartas[a.dataset.i].id === cartas[b.dataset.i].id) {
        a.classList.add("hecha"); b.classList.add("hecha");
        abiertas = [];
        aciertos++;
        $("#m-par").textContent = `${aciertos}/${pares.length}`;
        if (aciertos === pares.length) setTimeout(() => finMemory(movimientos, tiempo(), pares), 600);
      } else {
        bloqueado = true;
        setTimeout(() => { a.classList.remove("vuelta"); b.classList.remove("vuelta"); abiertas = []; bloqueado = false; }, 1000);
      }
    };
    juego.onclick = (ev) => { const c = ev.target.closest(".carta"); if (c) girar(c); };
    juego.onkeydown = (ev) => { const c = ev.target.closest(".carta"); if (c && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); girar(c); } };
  }

  function finMemory(movimientos, tiempo, pares) {
    pararTemporizador();
    marcarDiaEstudio();
    const rec = ls.get("recordMemory", null);
    const nuevo = !rec || movimientos < rec.movimientos;
    if (nuevo) ls.set("recordMemory", { movimientos, tiempo });
    juego.innerHTML = `
      <div class="resultado">
        <b>${movimientos}</b>
        <p>movimientos en ${tiempo}${nuevo ? " · ¡Nuevo récord!" : ""}</p>
        <p style="font-size:.85rem;opacity:.85">Has repasado: ${pares.map((e) => esc(e.nombres.ca)).join(", ")}.</p>
        <div class="dorso-botones">
          <button class="btn claro" data-otra>Jugar otra vez</button>
          <button class="btn" data-menu>Salir</button>
        </div>
      </div>`;
    juego.onclick = (ev) => {
      if (ev.target.closest("[data-otra]")) empezarMemory();
      if (ev.target.closest("[data-menu]")) menuJuegos();
    };
  }

  /* ---------- QUIZ ---------- */
  function opcionesQuiz() { pantallaOpciones("Quiz", "", empezarQuiz); }

  function empezarQuiz() {
    const pool = especiesDeGrupo(opcionesGuardadas.grupo);
    if (pool.length < 4) { alert("Se necesitan al menos 4 especies para el quiz."); return; }
    // 10 preguntas repartiendo las especies (se repiten si hay pocas)
    let orden = [];
    while (orden.length < 10) orden.push(...barajar(pool));
    orden = orden.slice(0, 10);
    const preguntas = orden.map((e) => {
      const tipos = ["planta", "hoja"].filter((t) => e.fotos?.[t]);
      const tipo = tipos.length ? tipos[Math.floor(Math.random() * tipos.length)] : null;
      const otras = barajar(pool.filter((x) => x.id !== e.id)).slice(0, 3);
      return { e, tipo, opciones: barajar([e, ...otras]) };
    });
    let n = 0, puntos = 0;

    const pintar = () => {
      const p = preguntas[n];
      const enunciado = p.tipo
        ? (p.tipo === "hoja" ? "¿De qué especie es esta hoja?" : "¿Qué especie es?")
        : `¿Cuál es el nombre científico de «${esc(p.e.nombres.ca)}»?`;
      juego.innerHTML = `
        <div class="pregunta">
          <div class="progreso"><div style="width:${(n / preguntas.length) * 100}%"></div></div>
          <div class="marcador" style="grid-template-columns:1fr 1fr">
            <div><b>${n + 1}/${preguntas.length}</b><span>Pregunta</span></div>
            <div><b>${puntos}</b><span>Aciertos</span></div>
          </div>
          ${p.tipo ? `<div data-zoom>${htmlFoto(p.e, p.tipo, "¿Qué especie es?")}</div>` : ""}
          <h2>${enunciado}</h2>
          <div class="respuestas">
            ${p.opciones.map((o) => `<button data-id="${esc(o.id)}">${esc(o.nombres.ca)}<small>${esc(o.nombres.lat)}</small></button>`).join("")}
          </div>
          <div id="explicacion"></div>
        </div>`;
    };

    juego.onclick = (ev) => {
      if (ev.target.closest("[data-zoom] img")) { verFoto(ev.target.closest("img").src); return; }
      const b = ev.target.closest(".respuestas button");
      if (b && !b.disabled) {
        const p = preguntas[n];
        const bien = b.dataset.id === p.e.id;
        if (bien) puntos++;
        registrarRespuesta(p.e.id, bien);
        $$(".respuestas button", juego).forEach((x) => {
          x.disabled = true;
          if (x.dataset.id === p.e.id) x.classList.add("bien");
          else if (x === b) x.classList.add("mal");
        });
        $("#explicacion").innerHTML = `
          <div class="explicacion">
            <strong>${bien ? "¡Correcto!" : "¡Casi!"}</strong> Es <b>${esc(p.e.nombres.ca)}</b> (${esc(p.e.nombres.es)}, <i>${esc(p.e.nombres.lat)}</i>).<br>
            ${esc(p.e.identificacion?.[0] || "")}
          </div>
          <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${n + 1 < preguntas.length ? "Siguiente" : "Ver resultado"}</button></div>`;
        return;
      }
      if (ev.target.closest("[data-siguiente]")) {
        n++;
        if (n < preguntas.length) { pintar(); window.scrollTo(0, 0); return; }
        const rec = ls.get("recordQuiz", null);
        const nuevo = rec == null || puntos > rec;
        if (nuevo) ls.set("recordQuiz", puntos);
        juego.innerHTML = `
          <div class="resultado">
            <b>${puntos}/10</b>
            <p>${puntos === 10 ? "¡Perfecto! Te lo sabes todo." : puntos >= 7 ? "¡Muy bien!" : puntos >= 5 ? "Vas por buen camino." : "A repasar un poco el herbario."}${nuevo ? " · ¡Nuevo récord!" : ""}</p>
            <div class="dorso-botones">
              <button class="btn claro" data-otra>Jugar otra vez</button>
              <button class="btn" data-menu>Salir</button>
            </div>
          </div>`;
        return;
      }
      if (ev.target.closest("[data-otra]")) empezarQuiz();
      if (ev.target.closest("[data-menu]")) menuJuegos();
    };
    cabeceraJuego(true);
    pintar();
  }

  /* ---------- Pantalla de resultado común ---------- */
  function pantallaResultado(puntos, total, claveRecord, alRepetir) {
    const rec = ls.get(claveRecord, null);
    const nuevo = rec == null || puntos > rec;
    if (nuevo) ls.set(claveRecord, puntos);
    marcarDiaEstudio();
    const r = puntos / total;
    juego.innerHTML = `
      <div class="resultado">
        <b>${puntos}/${total}</b>
        <p>${r === 1 ? "¡Perfecto!" : r >= 0.7 ? "¡Muy bien!" : r >= 0.5 ? "Vas por buen camino." : "A repasar un poco el herbario."}${nuevo ? " · ¡Nuevo récord!" : ""}</p>
        <div class="dorso-botones">
          <button class="btn claro" data-otra>Jugar otra vez</button>
          <button class="btn" data-menu>Salir</button>
        </div>
      </div>`;
    juego.onclick = (ev) => {
      if (ev.target.closest("[data-otra]")) alRepetir();
      if (ev.target.closest("[data-menu]")) menuJuegos();
    };
  }

  /* ---------- VERDADERO O FALSO ---------- */
  function opcionesVF() { pantallaOpciones("¿Verdadero o falso?", "", empezarVF); }

  function crearAfirmacion(e, pool) {
    const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const verdadera = Math.random() < 0.5;
    // Rasgos de otra especie claramente distinta (otro grupo u otro tipo de hoja)
    const distintas = pool.filter((o) => o.id !== e.id && (o.grupo !== e.grupo || o.tipoHoja !== e.tipoHoja) && o.identificacion?.length);
    const tipo = Math.random();
    if (tipo < 0.7 && e.identificacion?.length && (verdadera || distintas.length)) {
      if (verdadera) return { texto: azar(e.identificacion), verdadera, explicacion: "Es uno de sus rasgos para identificarla." };
      const o = azar(distintas);
      return { texto: azar(o.identificacion), verdadera, explicacion: `Ese rasgo es de ${o.nombres.ca} (${o.nombres.lat}), no de esta especie.` };
    }
    if (tipo < 0.85 || !e.origen) {
      return {
        texto: "Es una especie autóctona de Cataluña.",
        verdadera: !!e.autoctona,
        explicacion: e.autoctona ? "Sí: es autóctona." : `No: es originaria de ${e.origen}.`,
      };
    }
    const otrosOrigenes = pool.filter((o) => o.origen && norm(o.origen) !== norm(e.origen));
    if (verdadera || !otrosOrigenes.length) return { texto: `Es originaria de: ${e.origen}.`, verdadera: true, explicacion: "Correcto, ese es su origen." };
    return { texto: `Es originaria de: ${azar(otrosOrigenes).origen}.`, verdadera: false, explicacion: `No: es originaria de ${e.origen}.` };
  }

  function empezarVF() {
    const pool = especiesDeGrupo(opcionesGuardadas.grupo);
    if (pool.length < 2) { alert("Se necesitan al menos 2 especies."); return; }
    let orden = [];
    while (orden.length < 10) orden.push(...barajar(pool));
    const preguntas = orden.slice(0, 10).map((e) => ({ e, ...crearAfirmacion(e, todasLasEspecies()) }));
    let n = 0, puntos = 0;

    const pintar = () => {
      const p = preguntas[n];
      juego.innerHTML = `
        <div class="pregunta">
          <div class="progreso"><div style="width:${(n / preguntas.length) * 100}%"></div></div>
          <div class="marcador" style="grid-template-columns:1fr 1fr">
            <div><b>${n + 1}/${preguntas.length}</b><span>Pregunta</span></div>
            <div><b>${puntos}</b><span>Aciertos</span></div>
          </div>
          <div class="vf-cab">
            <div data-zoom>${htmlFoto(p.e, "planta", p.e.nombres.ca)}</div>
            <div><strong>${esc(p.e.nombres.ca)}</strong><small>${esc(p.e.nombres.es)} · <i>${esc(p.e.nombres.lat)}</i></small></div>
          </div>
          <p class="afirmacion">«${esc(p.texto)}»</p>
          <div class="vf-botones">
            <button class="btn principal" data-vf="1">Verdadero</button>
            <button class="btn" data-vf="0">Falso</button>
          </div>
          <div id="explicacion"></div>
        </div>`;
    };

    juego.onclick = (ev) => {
      if (ev.target.closest("[data-zoom] img")) { verFoto(ev.target.closest("img").src); return; }
      const b = ev.target.closest("[data-vf]");
      if (b && !b.disabled) {
        const p = preguntas[n];
        const bien = (b.dataset.vf === "1") === p.verdadera;
        if (bien) puntos++;
        registrarRespuesta(p.e.id, bien);
        $$("[data-vf]", juego).forEach((x) => {
          x.disabled = true;
          if ((x.dataset.vf === "1") === p.verdadera) x.classList.add("bien");
          else x.classList.add("mal");
        });
        $("#explicacion").innerHTML = `
          <div class="explicacion"><strong>${bien ? "¡Correcto!" : "¡Casi!"}</strong> Era <b>${p.verdadera ? "verdadero" : "falso"}</b>. ${esc(p.explicacion)}</div>
          <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${n + 1 < preguntas.length ? "Siguiente" : "Ver resultado"}</button></div>`;
        return;
      }
      if (ev.target.closest("[data-siguiente]")) {
        n++;
        if (n < preguntas.length) { pintar(); window.scrollTo(0, 0); }
        else pantallaResultado(puntos, preguntas.length, "recordVF", empezarVF);
      }
    };
    cabeceraJuego(true);
    pintar();
  }

  /* ---------- ORDENA ---------- */
  function opcionesOrdena() { pantallaOpciones("Ordena", "", empezarOrdena); }

  const valorAltura = (e) => {
    const t = cifraAltura(e.altura);
    const nums = (t.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => parseFloat(x.replace(",", ".")));
    return nums.length ? Math.max(...nums) : null;
  };
  const valorFrio = (e) => { const t = cifraFrio(e.rusticidad); return t ? -parseInt(t.replace("−", ""), 10) : null; };
  const CRITERIOS = [
    { id: "altura", titulo: "De más baja a más alta", valor: valorAltura, formato: (v, e) => `hasta ${v} m`, unidad: "altura máxima" },
    { id: "frio", titulo: "De menos a más resistente al frío", valor: (e) => { const v = valorFrio(e); return v == null ? null : -v; }, formato: (v) => `hasta −${v} °C`, unidad: "resistencia al frío" },
  ];

  function empezarOrdena() {
    const pool = especiesDeGrupo(opcionesGuardadas.grupo);
    const rondas = [];
    for (let i = 0; i < 5; i++) {
      const c = CRITERIOS[i % 2 === 0 ? 0 : 1];
      const conValor = barajar(pool.filter((e) => c.valor(e) != null));
      const elegidas = [];
      const usados = new Set();
      for (const e of conValor) {
        const v = c.valor(e);
        if (usados.has(v)) continue;
        usados.add(v); elegidas.push(e);
        if (elegidas.length === 4) break;
      }
      if (elegidas.length >= 3) rondas.push({ c, especies: elegidas });
    }
    if (!rondas.length) { alert("No hay suficientes especies con datos distintos de altura o frío para este grupo."); return; }
    let n = 0, puntos = 0, elegidas = [];

    const pintar = () => {
      const r = rondas[n];
      juego.innerHTML = `
        <div class="pregunta">
          <div class="progreso"><div style="width:${(n / rondas.length) * 100}%"></div></div>
          <div class="marcador" style="grid-template-columns:1fr 1fr">
            <div><b>${n + 1}/${rondas.length}</b><span>Ronda</span></div>
            <div><b>${puntos}</b><span>Aciertos</span></div>
          </div>
          <h2>${r.c.titulo}</h2>
          <p class="nota-dia" style="margin:0 0 12px">Toca las especies en orden. Toca otra vez para deshacer.</p>
          <div class="ordena">
            ${r.especies.map((e) => `
              <button class="ordena-item" data-id="${esc(e.id)}">
                ${htmlFoto(e, "planta", e.nombres.ca)}
                <span class="ordena-num"></span>
                <span class="ordena-nombre">${esc(e.nombres.ca)}</span>
              </button>`).join("")}
          </div>
          <div id="explicacion"></div>
        </div>`;
      elegidas = [];
    };

    const comprobar = () => {
      const r = rondas[n];
      const correcto = [...r.especies].sort((a, b) => r.c.valor(a) - r.c.valor(b));
      const bien = correcto.every((e, i) => e.id === elegidas[i]);
      if (bien) puntos++;
      marcarDiaEstudio();
      $$(".ordena-item", juego).forEach((x) => { x.disabled = true; x.classList.add(correcto.findIndex((e) => e.id === x.dataset.id) === elegidas.indexOf(x.dataset.id) ? "bien" : "mal"); });
      $("#explicacion").innerHTML = `
        <div class="explicacion"><strong>${bien ? "¡Correcto!" : "El orden correcto era:"}</strong>
          <ol class="orden-correcto">${correcto.map((e) => `<li><b>${esc(e.nombres.ca)}</b> — ${esc(r.c.formato(r.c.valor(e), e))}</li>`).join("")}</ol>
        </div>
        <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${n + 1 < rondas.length ? "Siguiente" : "Ver resultado"}</button></div>`;
    };

    juego.onclick = (ev) => {
      const it = ev.target.closest(".ordena-item");
      if (it && !it.disabled) {
        const id = it.dataset.id;
        if (elegidas.includes(id)) elegidas = elegidas.slice(0, elegidas.indexOf(id));
        else elegidas.push(id);
        $$(".ordena-item", juego).forEach((x) => {
          const i = elegidas.indexOf(x.dataset.id);
          $(".ordena-num", x).textContent = i >= 0 ? i + 1 : "";
          x.classList.toggle("elegida", i >= 0);
        });
        if (elegidas.length === rondas[n].especies.length) comprobar();
        return;
      }
      if (ev.target.closest("[data-siguiente]")) {
        n++;
        if (n < rondas.length) { pintar(); window.scrollTo(0, 0); }
        else pantallaResultado(puntos, rondas.length, "recordOrdena", empezarOrdena);
      }
    };
    cabeceraJuego(true);
    pintar();
  }

  /* =========================================================
   * IDENTIFICA — reconocer una planta con la cámara (Pl@ntNet)
   * ========================================================= */
  const ICONO_CHECK = `<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>`;
  const ICONO_INFO = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>`;
  const idCaptura = $("#id-captura"), idResultado = $("#id-resultado"), idPrevia = $("#id-previa");
  let organo = "auto";

  $("#id-organo").addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    organo = b.dataset.v;
    $$("#id-organo button").forEach((x) => x.classList.toggle("activo", x === b));
  });
  ["#id-camara", "#id-galeria"].forEach((s) => $(s).addEventListener("change", (ev) => {
    const archivo = ev.target.files[0];
    ev.target.value = "";
    if (archivo) identificar(archivo);
  }));

  // Nombre científico "Género especie" en minúsculas, sin autor ni signos
  const binomio = (n) => norm(n).replace(/×|\bx\b/g, " ").replace(/[^a-z\s-]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
  const genero = (n) => binomio(n).split(" ")[0];

  /** Busca la especie identificada en el herbario (por nombre o sinónimo). */
  function buscarEnHerbario(nombreCientifico) {
    const b = binomio(nombreCientifico);
    for (const e of todasLasEspecies()) {
      if (binomio(e.nombres.lat) === b) return { especie: e, via: null };
      const sin = (e.sinonimos || []).find((s) => binomio(s) === b);
      if (sin) return { especie: e, via: sin };
    }
    return null;
  }
  const parientesEnHerbario = (nombreCientifico) =>
    todasLasEspecies().filter((e) => genero(e.nombres.lat) === genero(nombreCientifico));

  async function resumenWikipedia(nombre, idioma) {
    try {
      const r = await fetch(`https://${idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombre.replace(/ /g, "_"))}`);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.type === "disambiguation" || !j.extract) return null;
      return { titulo: j.title, texto: j.extract, url: j.content_urls?.desktop?.page, foto: j.thumbnail?.source };
    } catch { return null; }
  }

  function volverACaptura() {
    idResultado.hidden = true;
    idCaptura.hidden = false;
    idPrevia.classList.remove("con-foto");
    idPrevia.style.backgroundImage = "";
    window.scrollTo(0, 0);
  }

  async function identificar(archivo) {
    const foto = await reducirImagen(archivo, 1280);
    idPrevia.style.backgroundImage = `url(${foto})`;
    idPrevia.classList.add("con-foto");
    idCaptura.hidden = true;
    idResultado.hidden = false;
    window.scrollTo(0, 0);

    if (!CFG.PLANTNET_KEY) {
      idResultado.innerHTML = `
        <div class="resultado-id fuera"><div class="cuerpo" style="padding-top:22px">
          <p class="aviso-id">La identificación todavía no está activada: falta la clave de Pl@ntNet en <b>js/config.js</b>.</p>
        </div></div>
        <div class="pie-id"><button class="btn principal" data-otra>Volver</button></div>`;
      return;
    }
    if (!navigator.onLine) {
      idResultado.innerHTML = `
        <div class="resultado-id fuera"><div class="cuerpo" style="padding-top:22px">
          <p class="aviso-id">Para identificar una planta hace falta conexión a internet. El resto de la app funciona sin conexión.</p>
        </div></div>
        <div class="pie-id"><button class="btn principal" data-otra>Volver</button></div>`;
      return;
    }

    idResultado.innerHTML = `
      <div class="cargando">
        <img class="foto-mini" src="${foto}" alt="">
        <strong>Identificando…</strong><br><small>Comparando con miles de especies</small>
      </div>`;

    try {
      const blob = await (await fetch(foto)).blob();
      const datos = new FormData();
      datos.append("images", blob, "foto.jpg");
      datos.append("organs", organo);
      const url = "https://my-api.plantnet.org/v2/identify/all?" + new URLSearchParams({
        "api-key": CFG.PLANTNET_KEY, lang: "es", "nb-results": "5", "include-related-images": "true",
      });
      const res = await fetch(url, { method: "POST", body: datos });
      if (res.status === 404) { mostrarSinResultado(foto); return; }
      if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
      const j = await res.json();
      if (!j.results?.length) { mostrarSinResultado(foto); return; }
      await mostrarResultado(foto, j.results);
    } catch (e) {
      console.warn(e);
      idResultado.innerHTML = `
        <div class="resultado-id fuera"><div class="cuerpo" style="padding-top:22px">
          <p class="aviso-id">No se ha podido identificar la foto. Comprueba la conexión y vuelve a intentarlo.</p>
        </div></div>
        <div class="pie-id"><button class="btn principal" data-otra>Probar otra vez</button></div>`;
    }
  }

  function mostrarSinResultado(foto) {
    idResultado.innerHTML = `
      <div class="resultado-id fuera">
        <div class="cab"><span class="sello no">${ICONO_INFO} Sin resultado</span></div>
        <div class="cuerpo" style="padding-top:16px">
          <p>No he reconocido ninguna planta en esta foto.</p>
          <p class="aviso-id">Prueba con una foto más cercana de una hoja o una flor, bien enfocada, con fondo sencillo y buena luz.</p>
        </div>
      </div>
      <div class="pie-id"><button class="btn principal" data-otra>Hacer otra foto</button></div>`;
  }

  const pct = (s) => Math.round(s * 100);
  const barraConfianza = (s) => `
    <div class="confianza">
      <span>Coincidencia: <b>${pct(s)} %</b>${s < 0.25 ? " · poco segura" : s < 0.5 ? " · probable" : " · muy probable"}</span>
      <div class="confianza-barra"><div style="width:${Math.max(4, pct(s))}%"></div></div>
    </div>`;

  async function mostrarResultado(foto, resultados) {
    const mejor = resultados[0];
    const cientifico = mejor.species.scientificNameWithoutAuthor;
    const enHerbario = buscarEnHerbario(cientifico);
    const dudosa = mejor.score < 0.25;
    const avisoDuda = dudosa ? `<p class="aviso-id">No estoy muy seguro. Mira también las otras posibilidades de abajo o prueba con otra foto más cercana.</p>` : "";

    let tarjeta;
    if (enHerbario) {
      const e = enHerbario.especie;
      tarjeta = `
        <div class="resultado-id en-herbario">
          <div class="cab">
            <span class="sello si">${ICONO_CHECK} ¡Está en tu herbario!</span>
            <h2>${esc(e.nombres.ca)}</h2>
            <p class="sub">${esc(e.nombres.es)} · <i>${esc(e.nombres.lat)}</i></p>
            ${barraConfianza(mejor.score)}
          </div>
          <div class="fotos-id">
            <div><figure class="foto"><img src="${foto}" alt="Tu foto"></figure><figcaption>Tu foto</figcaption></div>
            <div>${htmlFoto(e, "planta", "Planta")}<figcaption>Planta</figcaption></div>
            <div>${htmlFoto(e, "hoja", "Hoja")}<figcaption>Hoja</figcaption></div>
          </div>
          <div class="cuerpo">
            ${avisoDuda}
            ${enHerbario.via ? `<p class="aviso-id">Pl@ntNet la ha identificado como <i>${esc(enHerbario.via)}</i>, que se estudia dentro de esta ficha.</p>` : ""}
            <p>${esc(e.descripcion)}</p>
            ${e.identificacion?.length ? `<ul class="clave">${e.identificacion.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
            <div class="pie-id"><button class="btn claro" data-ficha="${esc(e.id)}">Ver ficha completa</button></div>
          </div>
        </div>`;
    } else {
      const sp = mejor.species;
      const comunes = (sp.commonNames || []).slice(0, 4);
      const [wikiEs, wikiCa] = await Promise.all([resumenWikipedia(cientifico, "es"), resumenWikipedia(cientifico, "ca")]);
      const wiki = wikiEs || (await resumenWikipedia(cientifico, "en"));
      const nombreCa = wikiCa && binomio(wikiCa.titulo) !== binomio(cientifico) ? wikiCa.titulo : "";
      const refFoto = mejor.images?.[0]?.url?.m || wiki?.foto;
      const parientes = parientesEnHerbario(cientifico);
      const titulo = comunes[0] || wiki?.titulo || cientifico;
      tarjeta = `
        <div class="resultado-id fuera">
          <div class="cab">
            <span class="sello no">${ICONO_INFO} No está en tu herbario</span>
            <h2>${esc(mayus(titulo))}</h2>
            <p class="sub"><i>${esc(cientifico)}</i></p>
            ${barraConfianza(mejor.score)}
          </div>
          <div class="fotos-id" style="grid-template-columns:1fr 1fr">
            <div><figure class="foto"><img src="${foto}" alt="Tu foto"></figure><figcaption>Tu foto</figcaption></div>
            ${refFoto ? `<div><figure class="foto"><img src="${esc(refFoto)}" alt="Foto de referencia" onerror="this.parentNode.classList.add('sin-foto')"></figure><figcaption>Referencia</figcaption></div>` : ""}
          </div>
          <div class="cuerpo">
            ${avisoDuda}
            <ul class="datos-id">
              <li><b>Científico</b><span><i>${esc(cientifico)}</i></span></li>
              ${comunes.length ? `<li><b>Castellano</b><span>${esc(comunes.join(", "))}</span></li>` : ""}
              ${nombreCa ? `<li><b>Catalán</b><span>${esc(nombreCa)}</span></li>` : ""}
              ${sp.family ? `<li><b>Familia</b><span>${esc(sp.family.scientificNameWithoutAuthor)}</span></li>` : ""}
              ${sp.genus ? `<li><b>Género</b><span><i>${esc(sp.genus.scientificNameWithoutAuthor)}</i></span></li>` : ""}
            </ul>
            ${parientes.length ? `<p class="pariente">Es del mismo género que ${parientes.map((p) => `<a href="#" data-ficha="${esc(p.id)}">${esc(p.nombres.ca)}</a>`).join(", ")}, que sí está en tu herbario.</p>` : ""}
            ${wiki ? `<p>${esc(wiki.texto.length > 520 ? wiki.texto.slice(0, 520).replace(/\s\S*$/, "") + "…" : wiki.texto)}</p>
              <p><a href="${esc(wiki.url)}" target="_blank" rel="noopener">Leer más en Wikipedia →</a></p>` : ""}
          </div>
        </div>`;
    }

    const otras = resultados.slice(1, 4).filter((r) => r.score >= 0.02);
    const alternativas = otras.length ? `
      <section class="alternativas">
        <h3>Otras posibilidades</h3>
        ${otras.map((r) => {
          const n = r.species.scientificNameWithoutAuthor;
          const h = buscarEnHerbario(n);
          return `<button class="alternativa" ${h ? `data-ficha="${esc(h.especie.id)}"` : "disabled"}>
            <span class="nombre">${h ? esc(h.especie.nombres.ca) + " · " : ""}<i>${esc(n)}</i>
              <small>${esc((r.species.commonNames || [])[0] || r.species.family?.scientificNameWithoutAuthor || "")}</small></span>
            ${h ? `<span class="mini-sello">En tu herbario</span>` : ""}
            <span class="pct">${pct(r.score)} %</span>
          </button>`;
        }).join("")}
      </section>` : "";

    ultimoResultado = {
      foto, cientifico, score: mejor.score, especieId: enHerbario?.especie.id || null,
      nombre: enHerbario ? enHerbario.especie.nombres.ca : mayus((mejor.species.commonNames || [])[0] || cientifico),
      familia: mejor.species.family?.scientificNameWithoutAuthor || "",
    };
    idResultado.innerHTML = `
      ${tarjeta}
      ${alternativas}
      <div class="pie-id">
        <button class="btn claro" data-guardar>Guardar en mis hallazgos</button>
        <button class="btn principal" data-otra>Identificar otra</button>
      </div>
      <p class="creditos-id">Identificación: Pl@ntNet · Información adicional: Wikipedia</p>`;
  }

  idResultado.addEventListener("click", async (ev) => {
    const f = ev.target.closest("[data-ficha]");
    if (f) { ev.preventDefault(); abrirFicha(f.dataset.ficha); return; }
    if (ev.target.closest("[data-otra]")) volverACaptura();
    const g = ev.target.closest("[data-guardar]");
    if (g && !g.disabled) { g.disabled = true; g.textContent = "Guardando…"; await guardarHallazgoActual(); g.textContent = "Guardado ✓"; }
    const img = ev.target.closest(".fotos-id img");
    if (img) verFoto(img.src);
  });

  /* ---------------- Mis hallazgos y mapa ---------------- */
  let ultimoResultado = null;
  let vistaHallazgos = "lista";
  let mapa = null;

  function miniatura(dataUrl, max = 700) {
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => ok(dataUrl);
      img.src = dataUrl;
    });
  }
  function ubicacionActual() {
    return new Promise((ok) => {
      if (!navigator.geolocation) return ok(null);
      navigator.geolocation.getCurrentPosition(
        (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => ok(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
  async function guardarHallazgoActual() {
    if (!ultimoResultado) return;
    const [foto, pos] = await Promise.all([miniatura(ultimoResultado.foto), ubicacionActual()]);
    const h = { ...ultimoResultado, foto, id: "h" + Date.now(), fecha: Date.now(), lat: pos?.lat ?? null, lon: pos?.lon ?? null };
    try {
      await operarHallazgo("put", h);
      if (!pos) alert("Guardado. No se ha podido obtener la ubicación, así que no saldrá en el mapa.");
      marcarDiaEstudio();
      renderHallazgos();
    } catch (e) {
      alert("No se ha podido guardar el hallazgo: " + e.message);
    }
  }

  const fechaCorta = (t) => new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  async function renderHallazgos() {
    const cont = $("#hallazgos");
    if (!cont) return;
    const lista = await hallazgosTodos();
    const conLugar = lista.filter((h) => h.lat != null);
    cont.innerHTML = `
      <div class="cab-seccion">
        <h2>Mis hallazgos <small>${lista.length}</small></h2>
        ${lista.length ? `<div class="chips conmutador">
          <button data-vh="lista" class="${vistaHallazgos === "lista" ? "activo" : ""}">Lista</button>
          <button data-vh="mapa" class="${vistaHallazgos === "mapa" ? "activo" : ""}">Mapa</button>
        </div>` : ""}
      </div>
      ${!lista.length ? `<p class="vacio">Cuando identifiques una planta, pulsa «Guardar en mis hallazgos» y aparecerá aquí con la foto, la fecha y el lugar.</p>`
        : vistaHallazgos === "mapa"
          ? `<div id="mapa" class="mapa"></div>${conLugar.length < lista.length ? `<p class="nota-dia">${lista.length - conLugar.length} hallazgo(s) sin ubicación no aparecen en el mapa.</p>` : ""}`
          : `<div class="rejilla-hallazgos">${lista.map((h) => `
              <button class="hallazgo" data-h="${esc(h.id)}">
                <img src="${h.foto}" alt="">
                ${h.especieId ? `<span class="marca-sabida" title="En tu herbario">${ICONO.check}</span>` : ""}
                <strong>${esc(h.nombre)}</strong>
                <small>${fechaCorta(h.fecha)}</small>
              </button>`).join("")}</div>`}`;
    if (vistaHallazgos === "mapa" && lista.length) pintarMapa(conLugar);
  }

  $("#hallazgos").addEventListener("click", async (ev) => {
    const vh = ev.target.closest("[data-vh]");
    if (vh) { vistaHallazgos = vh.dataset.vh; renderHallazgos(); return; }
    const h = ev.target.closest("[data-h]");
    if (h) abrirHallazgo(h.dataset.h);
  });

  function cargarLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise((ok, ko) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }

  async function pintarMapa(lista) {
    const div = $("#mapa");
    try { await cargarLeaflet(); }
    catch { div.innerHTML = `<p class="vacio">El mapa necesita conexión a internet.</p>`; return; }
    if (mapa) { mapa.remove(); mapa = null; }
    mapa = L.map(div, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap",
    }).addTo(mapa);
    const puntos = [];
    for (const h of lista) {
      const m = L.circleMarker([h.lat, h.lon], {
        radius: 9, color: "#fff", weight: 3, fillColor: h.especieId ? "#2f9a5b" : "#c79a2a", fillOpacity: 1,
      }).addTo(mapa);
      m.bindPopup(`<div class="popup-hallazgo"><img src="${h.foto}" alt=""><b>${esc(h.nombre)}</b><br><i>${esc(h.cientifico)}</i><br>${fechaCorta(h.fecha)}<br><a href="#" data-h="${esc(h.id)}">Ver detalle</a></div>`);
      puntos.push([h.lat, h.lon]);
    }
    if (puntos.length) mapa.fitBounds(puntos, { padding: [30, 30], maxZoom: 16 });
    else mapa.setView([41.39, 2.17], 8); // Cataluña
    div.addEventListener("click", (ev) => {
      const a = ev.target.closest("[data-h]");
      if (a) { ev.preventDefault(); abrirHallazgo(a.dataset.h); }
    });
  }

  const dlgHallazgo = $("#dlg-hallazgo");
  async function abrirHallazgo(id) {
    const h = (await hallazgosTodos()).find((x) => x.id === id);
    if (!h) return;
    dlgHallazgo.innerHTML = `
      <div class="ficha-cab oscuro">
        <button class="volver" data-cerrar>${ICONO.volver} Volver</button>
        <span></span>
      </div>
      <div class="hallazgo-detalle">
        <img src="${h.foto}" alt="" data-zoom-src>
        ${h.especieId ? `<span class="sello si">${ICONO.check} En tu herbario</span>` : `<span class="sello no">No está en tu herbario</span>`}
        <h2>${esc(h.nombre)}</h2>
        <p class="sub"><i>${esc(h.cientifico)}</i>${h.familia ? ` · ${esc(h.familia)}` : ""}</p>
        <ul class="datos-id">
          <li><b>Fecha</b><span>${new Date(h.fecha).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}</span></li>
          <li><b>Lugar</b><span>${h.lat != null ? `<a href="https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lon}#map=18/${h.lat}/${h.lon}" target="_blank" rel="noopener">Ver en el mapa</a>` : "Sin ubicación"}</span></li>
          <li><b>Coincidencia</b><span>${Math.round(h.score * 100)} %</span></li>
        </ul>
        <div class="pie-id">
          ${h.especieId ? `<button class="btn principal" data-ficha="${esc(h.especieId)}">Ver ficha</button>` : ""}
          <button class="btn peligro" data-borrar-h>Borrar</button>
        </div>
      </div>`;
    dlgHallazgo.onclick = async (ev) => {
      if (ev.target.closest("[data-cerrar]")) dlgHallazgo.close();
      else if (ev.target.closest("[data-zoom-src]")) verFoto(h.foto);
      else if (ev.target.closest("[data-ficha]")) { dlgHallazgo.close(); abrirFicha(h.especieId); }
      else if (ev.target.closest("[data-borrar-h]")) {
        if (!confirm("¿Borrar este hallazgo?")) return;
        await operarHallazgo("delete", h.id);
        dlgHallazgo.close();
        renderHallazgos();
      }
    };
    if (!dlgHallazgo.open) dlgHallazgo.showModal();
  }

  /* =========================================================
   * FORMULARIO (crear / editar)
   * ========================================================= */
  const dlgForm = $("#dlg-form");
  const form = $("#form-especie");

  function reducirImagen(archivo, max = 1000) {
    return new Promise((ok, ko) => {
      const lector = new FileReader();
      lector.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = ko;
        img.src = lector.result;
      };
      lector.onerror = ko;
      lector.readAsDataURL(archivo);
    });
  }

  function abrirFormulario(id) {
    const e = id ? porId(id) : {
      grupo: filtros.grupo || "", familia: "", nombres: { ca: "", es: "", lat: "" },
      tipoHoja: "", follaje: "", identificacion: [], ficha: {}, confusion: [], curiosidades: [], fotos: { planta: "", hoja: "" },
    };
    const f = e.ficha || {};
    const val = (v) => esc(v ?? "");
    const opciones = (arr, actual) => arr.map((o) => `<option value="${o}" ${actual === o ? "selected" : ""}>${o || "—"}</option>`).join("");
    const confTexto = (e.confusion || []).map((c) => `${porId(c.id)?.nombres.lat || c.id} | ${c.diferencia}`).join("\n");
    const campoFoto = (tipo, etiqueta) => {
      const v = e.fotos?.[tipo] || "";
      return `
      <fieldset class="campo-foto" data-tipo="${tipo}">
        <legend>${etiqueta}</legend>
        <img class="previa" src="${val(v)}" ${v ? "" : "hidden"} alt="">
        <label class="boton">Subir foto<input type="file" accept="image/*" hidden></label>
        <input type="url" class="url-foto" placeholder="…o pega la URL de una imagen" value="${v.startsWith("data:") ? "" : val(v)}">
        <button type="button" class="enlace" data-quitar>Quitar foto</button>
      </fieldset>`;
    };

    form.innerHTML = `
      <div><button type="button" class="volver" data-cerrar>${ICONO.volver} Volver</button></div>
      <h2>${id ? "Editar especie" : "Nueva especie"}</h2>
      <div class="rejilla">
        <label>Nombre en catalán *<input name="ca" required value="${val(e.nombres.ca)}"></label>
        <label>Nombre en castellano *<input name="es" required value="${val(e.nombres.es)}"></label>
        <label>Nombre científico *<input name="lat" required value="${val(e.nombres.lat)}" placeholder="Género especie"></label>
        <label>Otros nombres<input name="otrosNombres" value="${val(e.otrosNombres)}"></label>
        <label>Grupo<input name="grupo" list="lista-grupos" value="${val(e.grupo)}" placeholder="Palmeras, Trepadoras, Árboles…"></label>
        <datalist id="lista-grupos">${grupos().map((g) => `<option value="${esc(g)}">`).join("")}</datalist>
        <label>Familia<input name="familia" value="${val(e.familia)}"></label>
        <label>Tipo de hoja<select name="tipoHoja">${opciones(["", "pinnada", "palmeada", "costapalmeada", "simple", "compuesta", "acicular", "escamosa"], e.tipoHoja)}</select></label>
        <label>Follaje<select name="follaje">${opciones(["", "perenne", "caduco"], e.follaje)}</select></label>
        <label>Cómo trepa <small>(trepadoras)</small><input name="trepa" value="${val(e.trepa)}"></label>
        <label>Altura<input name="altura" value="${val(e.altura)}" placeholder="p. ej. 10–15 m"></label>
        <label>Resistencia al frío<input name="rusticidad" value="${val(e.rusticidad)}" placeholder="p. ej. Hasta −8 °C"></label>
        <label>Origen<input name="origen" value="${val(e.origen)}"></label>
        <label class="check"><input type="checkbox" name="autoctona" ${e.autoctona ? "checked" : ""}> Autóctona</label>
      </div>
      <div class="rejilla">
        ${campoFoto("planta", "Foto de la planta entera")}
        ${campoFoto("hoja", "Foto de la hoja")}
      </div>
      <label>Descripción<textarea name="descripcion" rows="4">${val(e.descripcion)}</textarea></label>
      <label>Características para identificarla <small>(una por línea; la primera es la «clave rápida»)</small><textarea name="identificacion" rows="6">${val((e.identificacion || []).join("\n"))}</textarea></label>
      <div class="rejilla">
        <label>Tronco / tallos<textarea name="f-tronco" rows="2">${val(f.tronco)}</textarea></label>
        <label>Hojas<textarea name="f-hojas" rows="2">${val(f.hojas)}</textarea></label>
        <label>Flores<textarea name="f-flores" rows="2">${val(f.flores)}</textarea></label>
        <label>Fruto<textarea name="f-fruto" rows="2">${val(f.fruto)}</textarea></label>
      </div>
      <label>Usos en jardinería<input name="usos" value="${val(e.usos)}"></label>
      <label>No confundir con <small>(una por línea: <code>Nombre científico | diferencia</code>)</small><textarea name="confusion" rows="3">${val(confTexto)}</textarea></label>
      <label>Curiosidades <small>(una por línea)</small><textarea name="curiosidades" rows="3">${val((e.curiosidades || []).join("\n"))}</textarea></label>
      <div class="pie-form">
        <button type="button" class="btn" data-cerrar>Cancelar</button>
        <button type="submit" class="btn principal">Guardar</button>
      </div>`;

    const fotosNuevas = { planta: e.fotos?.planta || "", hoja: e.fotos?.hoja || "" };
    const creditos = { ...(e.creditos || {}) };
    $$(".campo-foto", form).forEach((fs) => {
      const tipo = fs.dataset.tipo;
      const previa = $(".previa", fs);
      const mostrar = (src) => { fotosNuevas[tipo] = src; delete creditos[tipo]; previa.src = src; previa.hidden = !src; };
      $("input[type=file]", fs).addEventListener("change", async (ev) => {
        const archivo = ev.target.files[0];
        if (!archivo) return;
        try { mostrar(await reducirImagen(archivo)); $(".url-foto", fs).value = ""; }
        catch { alert("No se ha podido leer la imagen."); }
      });
      $(".url-foto", fs).addEventListener("change", (ev) => mostrar(ev.target.value.trim()));
      $("[data-quitar]", fs).addEventListener("click", () => { mostrar(""); $(".url-foto", fs).value = ""; });
    });

    form.onclick = (ev) => { if (ev.target.closest("[data-cerrar]")) dlgForm.close(); };
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const d = new FormData(form);
      const txt = (k) => String(d.get(k) || "").trim();
      const lineas = (k) => txt(k).split("\n").map((s) => s.trim()).filter(Boolean);
      const nuevoId = id || slug(txt("lat")) || "especie-" + Date.now();
      if (!id && porId(nuevoId)) { alert("Ya existe una especie con ese nombre científico."); return; }
      const confusion = lineas("confusion").map((l) => {
        const [nom, ...resto] = l.split("|");
        const otra = porLatin(nom.trim());
        return { id: otra ? otra.id : nom.trim(), diferencia: resto.join("|").trim() };
      });
      const especie = {
        ...(id ? e : {}),
        id: nuevoId,
        grupo: txt("grupo"), familia: txt("familia"),
        nombres: { ca: txt("ca"), es: txt("es"), lat: txt("lat") },
        otrosNombres: txt("otrosNombres"),
        tipoHoja: txt("tipoHoja"), follaje: txt("follaje"), trepa: txt("trepa"),
        origen: txt("origen"), autoctona: d.get("autoctona") === "on",
        altura: txt("altura"), rusticidad: txt("rusticidad"),
        descripcion: txt("descripcion"), identificacion: lineas("identificacion"),
        ficha: { tronco: txt("f-tronco"), hojas: txt("f-hojas"), flores: txt("f-flores"), fruto: txt("f-fruto") },
        usos: txt("usos"), confusion, curiosidades: lineas("curiosidades"),
        fuente: id ? e.fuente : "usuario",
        fotos: { ...fotosNuevas }, creditos,
      };
      const boton = $("button[type=submit]", form);
      boton.disabled = true; boton.textContent = "Guardando…";
      const ok = await guardarEspecie(especie);
      boton.disabled = false; boton.textContent = "Guardar";
      if (!ok) return;
      dlgForm.close();
      refrescarTodo();
      abrirFicha(nuevoId);
    };
    dlgForm.showModal();
    dlgForm.scrollTop = 0;
  }
  $("#btn-nueva").addEventListener("click", async () => { if (await asegurarClave()) abrirFormulario(null); });
  $("#btn-clave").addEventListener("click", async () => {
    if (claveGuardada()) {
      if (confirm("Este dispositivo tiene guardada la clave de edición. ¿Quieres olvidarla?")) ls.set("claveEdicion", "");
    } else if (await asegurarClave()) alert("Clave correcta. Ya puedes añadir y editar especies desde este dispositivo.");
  });
  $("#btn-sync").addEventListener("click", () => { ls.set("ultimaSync", 0); sincronizar(); });

  /* ---------------- Exportar / importar ---------------- */
  $("#btn-exportar").addEventListener("click", () => {
    const datos = { exportado: new Date().toISOString(), especies: todasLasEspecies() };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `herbario-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("#inp-importar").addEventListener("change", async (ev) => {
    const archivo = ev.target.files[0];
    ev.target.value = "";
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      const lista = Array.isArray(datos) ? datos : datos.especies;
      if (!Array.isArray(lista)) throw new Error("Formato no reconocido");
      const validas = lista.filter((e) => e?.id && e?.nombres?.lat);
      if (!(await importarEspecies(validas))) return;
      refrescarTodo();
      alert(`Importadas ${validas.length} especies.`);
    } catch (err) {
      alert("No se ha podido importar el archivo: " + err.message);
    }
  });

  /* ---------------- Arranque ---------------- */
  function refrescarTodo() { renderInicio(); renderProgreso(); renderChipsGrupo(); renderHerbario(); }
  (async () => {
    await cargarEstado();
    refrescarTodo();
    irA(ls.get("vista", "inicio"));
    $("#btn-clave").hidden = !remoto;
    $("#btn-sync").hidden = !remoto;
    pintarEstadoSync();
    // Traer lo último de la base compartida al abrir, al recuperar la conexión
    // y al volver a la app (p. ej. al cambiar de app en el móvil).
    sincronizar();
    window.addEventListener("online", sincronizar);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) sincronizar(); });
  })();

  /* ---------------- App instalable (PWA) ---------------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      // Buscar versión nueva de la app al abrirla y al volver a ella
      reg.update();
      document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update(); });
    }).catch((e) => console.warn("Service worker no registrado", e));
    // Cuando se instala una versión nueva, recargar para usarla
    // (no en la primera visita, cuando aún no había ninguna versión instalada)
    let recargado = false;
    const habiaVersion = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargado || !habiaVersion) return;
      recargado = true;
      location.reload();
    });
  }
})();
