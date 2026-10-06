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
    volver: `<svg class="ico"><use href="#i-atras"/></svg>`,
    lupa: `<svg class="ico"><use href="#i-buscar"/></svg>`,
    info: `<svg class="ico"><use href="#i-info"/></svg>`,
    logo: `<svg viewBox="0 0 48 32"><use href="#i-logo"/></svg>`,
    altavoz: `<svg class="ico"><use href="#i-altavoz"/></svg>`,
    flecha: `<svg class="ico"><use href="#i-abajo"/></svg>`,
    pdf: `<svg class="ico"><use href="#i-pdf"/></svg>`,
    comparar: `<svg class="ico"><use href="#i-comparar"/></svg>`,
    check: `<svg class="ico"><use href="#i-check"/></svg>`,
  };

  /* ---------------- Detalles de interfaz: animaciones y avisos ---------------- */
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Las fotos aparecen suavemente cuando terminan de cargar
  document.addEventListener("load", (ev) => {
    if (ev.target.tagName === "IMG") ev.target.classList.add("cargada");
  }, true);

  // Efecto de onda al tocar botones
  const SELECTOR_ONDA = ".btn, .navegacion button, .chips button, .pastilla, .juego-tarjeta, .boton-giro, .respuestas button, .alternativa, .vf-botones .btn, .ordena-item, .planta, .hallazgo, .opcion-rec .btn, .camara-botones .btn";
  document.addEventListener("pointerdown", (ev) => {
    if (sinMovimiento) return;
    const el = ev.target.closest(SELECTOR_ONDA);
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect();
    const onda = document.createElement("span");
    const lado = Math.max(r.width, r.height) * 2;
    onda.className = "onda";
    onda.style.cssText = `width:${lado}px;height:${lado}px;left:${ev.clientX - r.left - lado / 2}px;top:${ev.clientY - r.top - lado / 2}px`;
    el.appendChild(onda);
    onda.addEventListener("animationend", () => onda.remove());
  });

  // Mensajes breves en la parte inferior
  function avisoToast(texto) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = texto;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("saliendo"), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  // Confeti para celebrar récords
  function confeti() {
    if (sinMovimiento) return;
    const colores = ["#2f9a5b", "#7fd39c", "#e7a2c6", "#e6a54a", "#ffffff", "#237a47"];
    const capa = document.createElement("div");
    capa.className = "confeti";
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 100}%;background:${colores[i % colores.length]};animation-delay:${Math.random() * 0.4}s;animation-duration:${1.6 + Math.random() * 1.4}s;--giro:${Math.random() * 720 - 360}deg;--deriva:${Math.random() * 120 - 60}px`;
      capa.appendChild(p);
    }
    document.body.appendChild(capa);
    setTimeout(() => capa.remove(), 3500);
  }

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

  /* Valores sueltos compartidos con el service worker (recordatorio) */
  async function guardarKV(clave, valor) {
    try {
      const db = await abrirDB();
      await new Promise((ok, ko) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(valor, clave);
        tx.oncomplete = ok;
        tx.onerror = () => ko(tx.error);
      });
    } catch (e) { console.warn("No se pudo guardar", clave, e); }
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

  /* ---------------- Base de datos compartida (Firebase o Supabase) ----------------
   * Si config.js tiene los datos de Firebase (o de Supabase), la colección
   * "especies" online es la fuente de verdad: todos los dispositivos ven lo
   * mismo. La copia en IndexedDB sirve para abrir la app al instante y sin
   * conexión. Antes de cada cambio o borrado se guarda una copia de la
   * versión anterior en "historial" para poder recuperarla.
   */
  const CFG = window.CONFIG || {};
  const claveGuardada = () => ls.get("claveEdicion", "");

  /* --- Firebase (Firestore, por su API REST: sin librerías) --- */
  const firestore = CFG.FIREBASE_PROYECTO && CFG.FIREBASE_KEY && (() => {
    const base = `https://firestore.googleapis.com/v1/projects/${CFG.FIREBASE_PROYECTO}/databases/(default)/documents`;
    const conClave = (url) => url + (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(CFG.FIREBASE_KEY);
    async function pedir(url, opciones = {}) {
      const res = await fetch(conClave(url), { ...opciones, headers: { "Content-Type": "application/json", ...(opciones.headers || {}) } });
      if (!res.ok && res.status !== 404) {
        const err = new Error((await res.text()) || res.statusText);
        err.permiso = res.status === 401 || res.status === 403;
        throw err;
      }
      return res.status === 404 ? null : res.json().catch(() => null);
    }
    const campos = (datos, borrada) => ({
      fields: {
        json: { stringValue: JSON.stringify(datos) },
        borrada: { booleanValue: !!borrada },
        actualizado: { timestampValue: new Date().toISOString() },
      },
    });
    return {
      async listar() {
        const filas = [];
        let token = "";
        do {
          const j = await pedir(`${base}/especies?pageSize=300${token ? "&pageToken=" + encodeURIComponent(token) : ""}`);
          for (const d of j?.documents || []) {
            try {
              filas.push({ id: decodeURIComponent(d.name.split("/").pop()), datos: JSON.parse(d.fields.json.stringValue), borrada: !!d.fields.borrada?.booleanValue });
            } catch { /* documento mal formado: se ignora */ }
          }
          token = j?.nextPageToken || "";
        } while (token);
        return filas;
      },
      async historial(id, datosAnteriores, borradaAntes, operacion) {
        if (datosAnteriores === undefined) return; // no había nada que guardar
        await pedir(`${base}/historial`, {
          method: "POST",
          body: JSON.stringify({ fields: {
            id: { stringValue: id },
            json: { stringValue: JSON.stringify(datosAnteriores) },
            borrada: { booleanValue: !!borradaAntes },
            operacion: { stringValue: operacion },
            fecha: { timestampValue: new Date().toISOString() },
          } }),
        });
      },
      guardar: (id, datos, borrada = false) =>
        pedir(`${base}/especies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(campos(datos, borrada)) }),
      borrar: (id) => pedir(`${base}/especies/${encodeURIComponent(id)}`, { method: "DELETE" }),
    };
  })();

  /* --- Supabase (alternativa) --- */
  const supabase = !firestore && CFG.SUPABASE_URL && CFG.SUPABASE_KEY && (() => {
    async function api(ruta, opciones = {}) {
      const clave = claveGuardada();
      const res = await fetch(CFG.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + ruta, {
        ...opciones,
        headers: {
          apikey: CFG.SUPABASE_KEY, Authorization: "Bearer " + CFG.SUPABASE_KEY, "Content-Type": "application/json",
          ...(clave ? { "x-clave-edicion": clave } : {}), ...(opciones.headers || {}),
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
    return {
      listar: () => api("especies?select=id,datos,borrada"),
      historial: async () => {}, // en Supabase lo guarda un trigger de la base de datos
      guardar: (id, datos, borrada = false) => api("especies", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify([{ id, datos, borrada, actualizado: new Date().toISOString() }]),
      }),
      borrar: (id) => api("especies?id=eq." + encodeURIComponent(id), { method: "DELETE" }),
      comprobarClave: (clave) => fetch(CFG.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/clave_valida", {
        method: "POST", body: "{}",
        headers: { apikey: CFG.SUPABASE_KEY, Authorization: "Bearer " + CFG.SUPABASE_KEY, "Content-Type": "application/json", "x-clave-edicion": clave },
      }).then((r) => r.json()),
    };
  })();

  const nube = firestore || supabase || null;
  const remoto = !!nube;

  /** Pide la clave de edición (solo si está activada en config.js). */
  async function asegurarClave() {
    if (!remoto || !CFG.CLAVE_REQUERIDA || !nube.comprobarClave) return true;
    if (claveGuardada()) return true;
    const clave = prompt("Introduce la clave de edición para poder añadir o modificar especies:");
    if (!clave) return false;
    try {
      if (!(await nube.comprobarClave(clave.trim()))) { alert("La clave no es correcta."); return false; }
      ls.set("claveEdicion", clave.trim());
      return true;
    } catch {
      alert("No se ha podido comprobar la clave (¿hay conexión?).");
      return false;
    }
  }

  async function escribirRemoto(fn) {
    try {
      await fn();
      return true;
    } catch (e) {
      if (e.permiso && CFG.CLAVE_REQUERIDA) { ls.set("claveEdicion", ""); alert("La clave de edición no es válida. Vuelve a introducirla."); }
      else alert("No se ha podido guardar en la base de datos compartida. Comprueba la conexión y vuelve a intentarlo.");
      console.warn(e);
      return false;
    }
  }

  // Versión anterior de una especie (para el historial)
  const anterior = (id) => estado.especies[id] ?? (estado.borradas.includes(id) ? { id } : undefined);

  /** Descarga la base de datos compartida y actualiza la copia local. */
  let sincronizando = false;
  async function sincronizar() {
    if (!remoto || sincronizando || !navigator.onLine) return;
    sincronizando = true;
    try {
      const filas = await nube.listar();
      const nuevo = { especies: {}, borradas: [] };
      for (const f of filas || []) {
        if (f.borrada) nuevo.borradas.push(f.id);
        else nuevo.especies[f.id] = f.datos;
      }
      if (JSON.stringify(nuevo) !== JSON.stringify(estado)) {
        const antes = new Set(todasLasEspecies().map((e) => e.id));
        estado = nuevo;
        await guardarEstado();
        refrescarTodo();
        const nuevas = todasLasEspecies().filter((e) => !antes.has(e.id));
        if (ls.get("ultimaSync", 0) && nuevas.length) {
          avisoToast(nuevas.length === 1 ? `Nueva especie en el herbario: ${nuevas[0].nombres.ca}` : `${nuevas.length} especies nuevas en el herbario`);
        }
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
    el.textContent = t ? `Compartido · actualizado ${new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Compartido · sin sincronizar todavía";
  }

  /* Operaciones de escritura (online si hay base compartida, local si no) */
  async function guardarEspecie(especie) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      const previa = anterior(especie.id);
      const ok = await escribirRemoto(async () => {
        await nube.historial(especie.id, previa, estado.borradas.includes(especie.id), previa === undefined ? "CREAR" : "EDITAR");
        await nube.guardar(especie.id, especie);
      });
      if (!ok) return false;
    }
    estado.especies[especie.id] = especie;
    estado.borradas = estado.borradas.filter((b) => b !== especie.id);
    await guardarEstado();
    return true;
  }
  async function borrarEspecie(id) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      const previa = anterior(id) ?? (baseIds.has(id) ? porId(id) : undefined);
      const ok = await escribirRemoto(async () => {
        await nube.historial(id, previa, false, "BORRAR");
        // Las especies base se marcan como borradas; las creadas en la app se eliminan
        if (baseIds.has(id)) await nube.guardar(id, { id }, true);
        else await nube.borrar(id);
      });
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
      const previa = anterior(id);
      const ok = await escribirRemoto(async () => {
        await nube.historial(id, previa, estado.borradas.includes(id), "RESTAURAR");
        await nube.borrar(id);
      });
      if (!ok) return false;
    }
    delete estado.especies[id];
    estado.borradas = estado.borradas.filter((b) => b !== id);
    await guardarEstado();
    return true;
  }
  async function importarEspecies(lista) {
    if (remoto) {
      if (!(await asegurarClave())) return false;
      const ok = await escribirRemoto(async () => {
        for (const e of lista) {
          await nube.historial(e.id, anterior(e.id), estado.borradas.includes(e.id), "IMPORTAR");
          await nube.guardar(e.id, e);
        }
      });
      if (!ok) return false;
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
    $$(".vista").forEach((v) => {
      const esta = v.id === "vista-" + vista;
      v.hidden = !esta;
      if (esta) { v.classList.remove("entrando"); void v.offsetWidth; v.classList.add("entrando"); }
    });
    const botones = $$("#navegacion button");
    botones.forEach((b) => b.classList.toggle("activo", b.dataset.vista === vista));
    const i = botones.findIndex((b) => b.dataset.vista === vista);
    $("#navegacion").style.setProperty("--pos", Math.max(0, i));
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
  // Vibración al acertar / fallar (Android; en iPhone no hace nada)
  function vibrar(bien) {
    if (sinMovimiento || !navigator.vibrate) return;
    try { navigator.vibrate(bien ? 18 : [35, 60, 35]); } catch {}
  }

  function registrarRespuesta(id, bien) {
    vibrar(bien);
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
    guardarKV("ultimoDiaEstudio", hoy); // el service worker lo lee para no avisar si ya has estudiado
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
    const recQuiz = ls.get("recordQuiz", null);
    const icono = {
      hoja: `<svg class="ico"><use href="#i-hoja"/></svg>`,
      fuego: `<svg class="ico"><use href="#i-llama"/></svg>`,
      pin: `<svg class="ico"><use href="#i-ubicacion"/></svg>`,
      copa: `<svg class="ico"><use href="#i-trofeo"/></svg>`,
    };
    cont.innerHTML = `
      <div class="progreso-tarjeta">
        <div class="progreso-cab"><strong>Tu progreso</strong><span>${sabidas === lista.length && lista.length ? "¡Te las sabes todas!" : estudiadoHoy ? "Hoy ya has estudiado ✓" : "Aún no has estudiado hoy"}</span></div>
        <div class="casillas">
          <div class="casilla"><i>${icono.hoja}</i><span>Te sabes</span><b>${sabidas}<small>/${lista.length}</small></b></div>
          <div class="casilla"><i>${icono.fuego}</i><span>Racha</span><b>${r}<small> ${r === 1 ? "día" : "días"}</small></b></div>
          <div class="casilla"><i>${icono.pin}</i><span>Hallazgos</span><b id="n-hallazgos">–</b></div>
          <div class="casilla"><i>${icono.copa}</i><span>Quiz</span><b>${recQuiz ?? "–"}<small>${recQuiz != null ? "/10" : ""}</small></b></div>
        </div>
        <div class="progreso"><div style="width:${lista.length ? (sabidas / lista.length) * 100 : 0}%"></div></div>
        <p>Una especie cuenta como sabida cuando la aciertas 2 veces en los juegos y la última vez bien.</p>
      </div>`;
    hallazgosTodos().then((l) => { const el = $("#n-hallazgos"); if (el) el.textContent = l.length; });
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
    const h = hoy.getHours();
    $("#saludo").textContent = h < 6 ? "Buenas noches," : h < 14 ? "Buenos días," : h < 21 ? "Buenas tardes," : "Buenas noches,";
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
   * RECORDATORIO DIARIO
   *  1) Notificación automática (Android con la app instalada):
   *     el service worker se despierta de vez en cuando (Periodic
   *     Background Sync) y, a partir de la hora elegida, avisa si
   *     aún no has estudiado ese día.
   *  2) Evento diario en el calendario del móvil (.ics): funciona
   *     en todos los móviles y a la hora exacta.
   * ========================================================= */
  const dlgRecordatorio = $("#dlg-recordatorio");
  const configRecordatorio = () => ({ hora: 19, ...ls.get("recordatorio", {}), activo: true });
  const soportaSyncPeriodico = () => "serviceWorker" in navigator && "periodicSync" in ServiceWorkerRegistration.prototype;
  const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const estaInstalada = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  // Estado real de los avisos en este dispositivo
  function estadoAvisos() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return "no-soportado";
    if (Notification.permission === "denied") return "bloqueado";
    if (Notification.permission === "default") return "pendiente";
    if (!soportaSyncPeriodico()) return "sin-sync";
    return "activo";
  }

  function pintarPuntoRecordatorio() {
    const e = estadoAvisos();
    const p = $("#punto-recordatorio");
    p.hidden = false;
    p.classList.toggle("aviso", e === "pendiente" || e === "bloqueado");
  }

  /* Los avisos se activan solos: se registran siempre que haya permiso,
   * y el permiso se pide automáticamente en el primer toque del usuario
   * (los navegadores no dejan pedirlo sin un toque). */
  async function asegurarAvisos() {
    const cfg = configRecordatorio();
    await guardarKV("recordatorio", cfg);
    if (estadoAvisos() !== "activo") return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const tags = await reg.periodicSync.getTags();
      if (!tags.includes("recordatorio-diario")) await reg.periodicSync.register("recordatorio-diario", { minInterval: 60 * 60 * 1000 });
    } catch (e) {
      // Chrome solo lo permite con la app instalada; se reintenta en cada arranque
      console.warn("Aviso diario pendiente de instalar la app", e);
    }
  }

  async function pedirPermisoAvisos() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    try { await Notification.requestPermission(); } catch {}
    pintarPuntoRecordatorio();
    await asegurarAvisos();
    if (Notification.permission === "granted") avisoToast("Recordatorio diario activado 🌿");
  }
  // Si ya se vio la bienvenida y el permiso sigue sin contestar,
  // se vuelve a pedir en el primer toque de cada sesión.
  document.addEventListener("pointerup", function primerToque() {
    document.removeEventListener("pointerup", primerToque, true);
    if (ls.get("bienvenidaVista", false)) setTimeout(pedirPermisoAvisos, 400);
  }, true);

  /* ---------------- Bienvenida (primera vez) ---------------- */
  const dlgBienvenida = $("#dlg-bienvenida");
  const ico = (n) => `<svg class="ico"><use href="#i-${n}"/></svg>`;

  function mostrarBienvenida() {
    const pasos = [
      `<div class="bv-logo"><svg viewBox="0 0 48 32"><use href="#i-logo"/></svg></div>
       <h2><span class="fino">Te damos la bienvenida a</span><br>Herbolario</h2>
       <p>Tu base de datos botánica para estudiar <b>Espais exteriors i jardineria</b>: especies, fichas completas, fotos y juegos para aprender cada día.</p>`,
      `<h2><span class="fino">Todo lo que</span><br>puedes hacer</h2>
       <ul class="bv-lista">
         <li><i>${ico("destellos")}</i><div><b>Especie del día</b><span>Una nueva cada 24 h. ¿Te la sabes? Gira la tarjeta.</span></div></li>
         <li><i>${ico("hoja")}</i><div><b>Herbario</b><span>Fichas con fotos, claves, calendario y jardinería.</span></div></li>
         <li><i>${ico("camara")}</i><div><b>Identifica</b><span>Haz una foto y descubre qué planta es.</span></div></li>
         <li><i>${ico("mando")}</i><div><b>Jugar</b><span>Siete juegos para repasar y ganar tu racha.</span></div></li>
       </ul>`,
      `<div class="bv-campana">${ico("campana")}</div>
       <h2><span class="fino">No pierdas</span><br>tu racha</h2>
       <p>Te avisaremos cada día para descubrir la especie del día. Pulsa <b>«Permitir»</b> cuando el móvil te pregunte.</p>
       ${esIOS() && !soportaSyncPeriodico() ? `<p class="bv-nota">En iPhone, además, puedes añadir el aviso a tu calendario desde la campana del inicio.</p>` : ""}`,
    ];
    let i = 0;
    const pintar = (dir = 0) => {
      const ultimo = i === pasos.length - 1;
      dlgBienvenida.innerHTML = `
        <div class="bv">
          <div class="bv-paso ${dir > 0 ? "desde-der" : dir < 0 ? "desde-izq" : ""}">${pasos[i]}</div>
          <div class="bv-pie">
            <div class="bv-puntos">${pasos.map((_, n) => `<i class="${n === i ? "activo" : ""}"></i>`).join("")}</div>
            <button class="btn principal bv-boton" data-bv="${ultimo ? "fin" : "sig"}">${ultimo ? `${ico("campana")} Activar recordatorio` : "Siguiente"}</button>
          </div>
        </div>`;
    };
    const terminar = async () => {
      ls.set("bienvenidaVista", true);
      await pedirPermisoAvisos();
      dlgBienvenida.close();
      pintarPuntoRecordatorio();
    };
    dlgBienvenida.onclick = (ev) => {
      const b = ev.target.closest("[data-bv]");
      if (!b) return;
      if (b.dataset.bv === "sig") { i++; pintar(1); }
      else terminar();
    };
    // Deslizar entre pasos
    let x0 = null;
    dlgBienvenida.ontouchstart = (ev) => { x0 = ev.touches[0].clientX; };
    dlgBienvenida.ontouchend = (ev) => {
      if (x0 == null) return;
      const dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (dx < -50 && i < pasos.length - 1) { i++; pintar(1); }
      else if (dx > 50 && i > 0) { i--; pintar(-1); }
    };
    dlgBienvenida.addEventListener("cancel", (ev) => ev.preventDefault()); // no se cierra con "atrás"
    pintar();
    dlgBienvenida.showModal();
  }

  /* ---------------- Modo oscuro automático ---------------- */
  const mqOscuro = matchMedia("(prefers-color-scheme: dark)");
  const aplicarTema = () => { document.documentElement.dataset.tema = mqOscuro.matches ? "oscuro" : "claro"; };
  mqOscuro.addEventListener?.("change", aplicarTema);

  async function probarNotificacion() {
    if (!("Notification" in window) || (await Notification.requestPermission()) !== "granted") {
      alert("Primero tienes que permitir las notificaciones.");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification("Herbolario", {
      body: "¡Así te llegará el aviso! Hay una especie nueva esperándote. ¿Te la sabes?",
      icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "recordatorio",
    });
  }

  /** Crea un archivo de calendario con un evento diario que abre la app. */
  function descargarCalendario(hora) {
    const url = location.origin + location.pathname.replace(/index\.html$/, "");
    const hoy = new Date();
    const d = (n) => String(n).padStart(2, "0");
    const inicio = `${hoy.getFullYear()}${d(hoy.getMonth() + 1)}${d(hoy.getDate())}T${d(hora)}0000`;
    const fin = `${hoy.getFullYear()}${d(hoy.getMonth() + 1)}${d(hoy.getDate())}T${d(hora)}1500`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Herbolario//Recordatorio//ES", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:herbario-recordatorio-${Date.now()}@herbario`,
      `DTSTAMP:${hoy.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
      `DTSTART:${inicio}`, `DTEND:${fin}`,
      "RRULE:FREQ=DAILY",
      "SUMMARY:🌿 Herbolario: ¿te sabes la especie de hoy?",
      `DESCRIPTION:Abre la app y gira la tarjeta de la especie del día.\\n${url}`,
      `URL:${url}`,
      "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Herbolario: especie del día", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "recordatorio-herbario.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function abrirRecordatorio() {
    const c = configRecordatorio();
    const horas = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 – 22:00
    dlgRecordatorio.innerHTML = `
      <div class="hoja-cuerpo">
        <button class="cerrar-x" data-cerrar aria-label="Cerrar">×</button>
        <h2>Recordatorio diario</h2>
        <p class="nota">Te aviso para que no pierdas la racha y descubras la especie del día.</p>
        <label class="campo-hora">Avisarme a partir de las
          <select id="rec-hora">${horas.map((h) => `<option value="${h}" ${h === c.hora ? "selected" : ""}>${h}:00</option>`).join("")}</select>
        </label>

        ${{
          activo: `<p class="estado-rec">${ICONO.check} Notificaciones activadas${estaInstalada() ? "" : " · se enviarán cuando tengas la app instalada"}</p>`,
          pendiente: `<div class="opcion-rec"><div><strong>Falta tu permiso</strong><span>El móvil necesita que aceptes las notificaciones una vez.</span></div><button class="btn principal" data-rec="permiso">Permitir</button></div>`,
          bloqueado: `<div class="opcion-rec alerta"><div><strong>Notificaciones bloqueadas</strong><span>Actívalas en los ajustes del navegador: toca el candado junto a la dirección → Notificaciones → Permitir.</span></div></div>`,
          "sin-sync": `<div class="opcion-rec"><div><strong>${esIOS() ? "iPhone" : "Este navegador"}</strong><span>No permite avisos automáticos de apps web. Usa el calendario de abajo: te avisará cada día a la hora exacta.</span></div></div>`,
          "no-soportado": `<div class="opcion-rec"><div><strong>Sin notificaciones</strong><span>Este navegador no las permite. Usa el calendario de abajo.</span></div></div>`,
        }[estadoAvisos()]}

        <div class="opcion-rec">
          <div>
            <strong>Añadir al calendario</strong>
            <span>Crea un evento diario en el calendario de tu móvil, a la hora exacta y con enlace a la app. Funciona en Android y en iPhone.</span>
          </div>
          <button class="btn claro" data-rec="ics">Añadir</button>
        </div>

        <button class="enlace" data-rec="probar">Probar cómo se ve una notificación</button>
      </div>`;
    dlgRecordatorio.onclick = async (ev) => {
      if (ev.target === dlgRecordatorio || ev.target.closest("[data-cerrar]")) { dlgRecordatorio.close(); return; }
      const b = ev.target.closest("[data-rec]");
      if (!b) return;
      const hora = +$("#rec-hora", dlgRecordatorio).value;
      if (b.dataset.rec === "permiso") { await pedirPermisoAvisos(); abrirRecordatorio(); }
      else if (b.dataset.rec === "ics") descargarCalendario(hora);
      else if (b.dataset.rec === "probar") probarNotificacion();
      pintarPuntoRecordatorio();
    };
    dlgRecordatorio.onchange = async (ev) => {
      if (ev.target.id !== "rec-hora") return;
      const nuevo = { ...configRecordatorio(), hora: +ev.target.value };
      ls.set("recordatorio", nuevo);
      await guardarKV("recordatorio", nuevo);
      avisoToast(`Te avisaré a partir de las ${nuevo.hora}:00`);
    };
    if (!dlgRecordatorio.open) dlgRecordatorio.showModal();
  }
  $("#btn-recordatorio").addEventListener("click", abrirRecordatorio);

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
          ${es.map((e, n) => `
            <article class="planta" data-id="${esc(e.id)}" tabindex="0" style="--i:${n}">
              ${htmlFoto(e, "planta", e.nombres.lat)}
              <h3>${esc(e.nombres.ca)}</h3>
              <p class="lat">${esc(e.nombres.lat)}</p>
              <p class="estado ${estaSabida(e.id) ? "si" : ""}">${estaSabida(e.id) ? "Te la sabes" : "Por aprender"}</p>
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

    const ic = {
      altura: `<svg class="ico"><use href="#i-altura"/></svg>`,
      frio: `<svg class="ico"><use href="#i-frio"/></svg>`,
      hoja: `<svg class="ico"><use href="#i-hoja"/></svg>`,
      origen: `<svg class="ico"><use href="#i-mundo"/></svg>`,
    };
    const origenCorto = (e.origen || "").split(/[(,]/)[0].replace(/^(Endémica de(l)?|Norte de|Sur de|Este de|Oeste de|Noroeste de|Suroeste de)\s+/i, "").trim();
    const casillas = [
      alt && `<div class="casilla"><i>${ic.altura}</i><span>Altura</span><b>${esc(alt)}<small> m</small></b></div>`,
      frio && `<div class="casilla"><i>${ic.frio}</i><span>Frío</span><b>${esc(frio)}<small> °C</small></b></div>`,
      e.tipoHoja && `<div class="casilla"><i>${ic.hoja}</i><span>Hoja</span><b class="texto">${esc(mayus(e.tipoHoja))}</b></div>`,
      origenCorto && `<div class="casilla"><i>${ic.origen}</i><span>Origen</span><b class="texto">${esc(origenCorto)}</b></div>`,
    ].filter(Boolean).join("");
    const etiquetas = [
      sabida && `<span class="etiqueta-estado si">Te la sabes</span>`,
      e.autoctona && `<span class="etiqueta-estado">Autóctona</span>`,
      e.follaje && `<span class="etiqueta-estado neutra">Hoja ${({ caduco: "caduca", semicaduco: "semicaduca" })[e.follaje] || "perenne"}</span>`,
      e.grupo && `<span class="etiqueta-estado neutra">${esc(e.grupo)}</span>`,
    ].filter(Boolean).join("");

    dlgFicha.innerHTML = `
      <div class="fondo-difuso" style="background-image:url('${esc(e.fotos?.planta || "")}')"></div>
      <div class="ficha-cab">
        <button class="icono cristal" data-cerrar aria-label="Volver">${ICONO.volver}</button>
        <span class="botones-cab">
          <button class="icono cristal" data-pdf aria-label="Guardar en PDF" title="PDF">${ICONO.pdf}</button>
          <button class="icono cristal" data-editar aria-label="Editar" title="Editar"><svg class="ico"><use href="#i-editar"/></svg></button>
        </span>
      </div>
      <section class="hero hero-v2">
        <div class="hero-fotos">
          <div class="carrusel-fotos" data-zoom>
            ${TIPOS_FOTO.filter(([t]) => e.fotos?.[t]).map(([t, n]) => `
              <figure class="slide" data-tipo="${t}">
                ${htmlFoto(e, t, n + " de " + e.nombres.lat)}
                <figcaption>${n}</figcaption>
              </figure>`).join("")}
          </div>
          <div class="puntos">${TIPOS_FOTO.filter(([t]) => e.fotos?.[t]).map(([t], i) => `<button data-punto="${i}" class="${i ? "" : "activo"}" aria-label="Foto ${i + 1}"></button>`).join("")}</div>
          <div class="credito-actual">${htmlCredito(e, "planta")}</div>
        </div>
        <div class="hero-texto">
          <h2>${esc(e.nombres.ca)} ${botonVoz(e.nombres.ca, "ca", "el nombre en catalán")}</h2>
          <p class="sub">${esc(e.nombres.es)} ${botonVoz(e.nombres.es, "es", "el nombre en castellano")}</p>
          <p class="sub lat"><i>${esc(e.nombres.lat)}</i> ${botonVoz(e.nombres.lat, "lat", "el nombre científico")}</p>
          <p class="grupo">${esc(e.familia || "")}</p>
          <div class="etiquetas-estado">${etiquetas}</div>
        </div>
      </section>
      <section class="resumen">
        <h3>Resumen</h3>
        <div class="casillas">${casillas}</div>
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

    // Carrusel de fotos: puntos y crédito de la foto visible
    const carrusel = $(".carrusel-fotos", dlgFicha);
    const slides = $$(".slide", carrusel);
    const puntos = $$("[data-punto]", dlgFicha);
    let actual = 0;
    const marcarSlide = (i) => {
      if (i === actual || !slides[i]) return;
      actual = i;
      puntos.forEach((p, n) => p.classList.toggle("activo", n === i));
      $(".credito-actual", dlgFicha).innerHTML = htmlCredito(e, slides[i].dataset.tipo);
    };
    carrusel.addEventListener("scroll", () => marcarSlide(Math.round(carrusel.scrollLeft / carrusel.clientWidth)), { passive: true });
    carrusel.marcarSlide = marcarSlide;
    if (puntos.length < 2) $(".puntos", dlgFicha).hidden = true;

    // Recordar qué apartados se despliegan
    $$("details.acordeon", dlgFicha).forEach((d) => d.addEventListener("toggle", () => {
      ls.set("seccionesAbiertas", $$("details.acordeon[open]", dlgFicha).map((x) => x.dataset.sec));
    }));

    dlgFicha.onclick = async (ev) => {
      const t = ev.target;
      if (t.closest("[data-cerrar]")) dlgFicha.close();
      else if (t.closest("[data-voz]")) { const b = t.closest("[data-voz]"); hablar(b.dataset.voz, b.dataset.idioma); }
      else if (t.closest("[data-punto]")) {
        const c = $(".carrusel-fotos", dlgFicha);
        const i = +t.closest("[data-punto]").dataset.punto;
        c.marcarSlide(i);
        c.scrollTo({ left: c.clientWidth * i, behavior: sinMovimiento ? "auto" : "smooth" });
      }
      else if (t.closest(".carrusel-fotos img")) verFoto(t.closest("img").src, $(".carrusel-fotos", dlgFicha));
      else if (t.closest("[data-zoom] img")) verFoto(t.closest("img").src, t.closest("[data-zoom]"));
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
      else if (ev.target.closest("[data-zoom] img")) verFoto(ev.target.closest("img").src, ev.target.closest("[data-zoom]"));
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
        <footer>Herbolario · Base de datos botánica — ${new Date().toLocaleDateString("es-ES")}</footer>
      </article>`;
    const imgs = $$("img", zona);
    Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))))
      .then(() => {
        document.title = `${e.nombres.ca} - ficha`;
        window.print();
        document.title = "Herbolario · Base de datos botánica";
      });
  }
  window.addEventListener("afterprint", () => { $("#impresion").innerHTML = ""; });

  /* ---------------- Visor de fotos con paso de imágenes ----------------
   * verFoto(src, contexto): si el contexto tiene varias fotos, se puede
   * pasar de una a otra deslizando, con las flechas o con el teclado.
   */
  const dlgFoto = $("#dlg-foto");
  let visor = { lista: [], i: 0 };

  function pintarVisor(direccion = 0) {
    const { lista, i } = visor;
    const img = $(".visor-img", dlgFoto);
    img.classList.remove("desde-izq", "desde-der", "cargada");
    void img.offsetWidth;
    if (direccion) img.classList.add(direccion > 0 ? "desde-der" : "desde-izq");
    img.src = lista[i].src;
    $(".visor-pie", dlgFoto).textContent = lista.length > 1 ? `${lista[i].titulo ? lista[i].titulo + " · " : ""}${i + 1} / ${lista.length}` : lista[i].titulo || "";
    $$(".visor-flecha", dlgFoto).forEach((b) => (b.hidden = lista.length < 2));
  }
  function moverVisor(d) {
    if (visor.lista.length < 2) return;
    visor.i = (visor.i + d + visor.lista.length) % visor.lista.length;
    pintarVisor(d);
  }

  function verFoto(src, contexto) {
    if (!src) return;
    const cont = contexto?.closest?.(".galeria, .comp-cols") || contexto;
    const imgs = cont ? $$("img", cont).filter((x) => x.getAttribute("src")) : [];
    const titulo = (x) => x.closest(".slide, .galeria figure, .fotos-id > div, .comp-col")?.querySelector("figcaption, h3")?.textContent.trim() || "";
    const lista = imgs.length ? imgs.map((x) => ({ src: x.src, titulo: titulo(x) })) : [{ src, titulo: "" }];
    visor = { lista, i: Math.max(0, lista.findIndex((x) => x.src === src)) };
    if (!$(".visor-img", dlgFoto)) {
      dlgFoto.innerHTML = `
        <img class="visor-img" alt="">
        <button class="visor-flecha izq" data-mover="-1" aria-label="Anterior">${ICONO.volver}</button>
        <button class="visor-flecha der" data-mover="1" aria-label="Siguiente">${ICONO.volver}</button>
        <button class="visor-cerrar" data-cerrar-visor aria-label="Cerrar">×</button>
        <p class="visor-pie"></p>`;
    }
    pintarVisor();
    if (!dlgFoto.open) dlgFoto.showModal();
  }
  dlgFoto.addEventListener("click", (ev) => {
    const m = ev.target.closest("[data-mover]");
    if (m) { moverVisor(+m.dataset.mover); return; }
    if (ev.target.closest("[data-cerrar-visor]") || ev.target === dlgFoto || ev.target.classList.contains("visor-img") && visor.lista.length < 2) dlgFoto.close();
  });
  dlgFoto.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") moverVisor(1);
    if (ev.key === "ArrowLeft") moverVisor(-1);
  });
  // Deslizar con el dedo
  let toqueX = null;
  dlgFoto.addEventListener("touchstart", (ev) => { toqueX = ev.touches[0].clientX; }, { passive: true });
  dlgFoto.addEventListener("touchend", (ev) => {
    if (toqueX == null) return;
    const dx = ev.changedTouches[0].clientX - toqueX;
    toqueX = null;
    if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1);
  });

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
      <header class="titulo saludo-cab juegos-cab">
        <h1><span class="fino">Aprende</span><br>jugando</h1>
        <p class="sub-saludo">Repasa las especies con juegos. Cuentan para tu progreso.</p>
      </header>
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
        <button class="juego-tarjeta verde" data-juego="conecta">
          <span class="nuevo">Nuevo</span>
          <h2>Conecta con hilos</h2>
          <p>Une cada foto o nombre con su pareja trazando un hilo.</p>
          <p class="record">${ls.get("recordConecta", null) != null ? `Mejor puntuación: ${ls.get("recordConecta")}/15` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
        <button class="juego-tarjeta" data-juego="misterio">
          <span class="nuevo">Nuevo</span>
          <h2>Foto misteriosa</h2>
          <p>La foto se va aclarando. ¡Adivínala cuanto antes!</p>
          <p class="record">${ls.get("recordMisterio", null) != null ? `Mejor puntuación: ${ls.get("recordMisterio")} puntos` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
        <button class="juego-tarjeta verde" data-juego="escribe">
          <span class="nuevo">Nuevo</span>
          <h2>Escribe el nombre</h2>
          <p>Como en el examen: ves la foto y escribes el nombre.</p>
          <p class="record">${ls.get("recordEscribe", null) != null ? `Mejor puntuación: ${ls.get("recordEscribe")}/8` : "Aún sin puntuación"}</p>
          <span class="boton-giro"><span></span></span>
        </button>
      </div>`;
    juego.onclick = (ev) => {
      const b = ev.target.closest("[data-juego]");
      if (b) ({ memory: opcionesMemory, quiz: opcionesQuiz, vf: opcionesVF, ordena: opcionesOrdena, conecta: opcionesConecta, misterio: opcionesMisterio, escribe: opcionesEscribe })[b.dataset.juego]();
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
        vibrar(true);
        abiertas = [];
        aciertos++;
        $("#m-par").textContent = `${aciertos}/${pares.length}`;
        if (aciertos === pares.length) setTimeout(() => finMemory(movimientos, tiempo(), pares), 600);
      } else {
        bloqueado = true;
        vibrar(false);
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
    if (nuevo) setTimeout(confeti, 250);
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
        if ((nuevo && puntos > 0) || puntos === 10) setTimeout(confeti, 250);
        marcarDiaEstudio();
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
    if ((nuevo && puntos > 0) || r === 1) setTimeout(confeti, 250);
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

  /* ---------- CONECTA CON HILOS ---------- */
  const MODOS_CONECTA = [
    ["foto-lat", "Foto ↔ científico"],
    ["ca-lat", "Catalán ↔ científico"],
    ["rasgo", "Especie ↔ rasgo"],
    ["hoja-ca", "Hoja ↔ catalán"],
  ];
  function opcionesConecta() {
    const actual = MODOS_CONECTA.some(([m]) => m === opcionesGuardadas.modoConecta) ? opcionesGuardadas.modoConecta : "foto-lat";
    opcionesGuardadas.modoConecta = actual;
    pantallaOpciones("Conecta con hilos", `<div><span>Modo</span>${chipsOpcion("modoConecta", MODOS_CONECTA, actual)}</div>`, empezarConecta);
  }

  function empezarConecta() {
    const modo = opcionesGuardadas.modoConecta || "foto-lat";
    const tipoFoto = modo === "hoja-ca" ? "hoja" : "planta";
    const pool = especiesDeGrupo(opcionesGuardadas.grupo).filter((e) =>
      (modo === "foto-lat" || modo === "hoja-ca") ? e.fotos?.[tipoFoto] : modo === "rasgo" ? e.identificacion?.length : true);
    if (pool.length < 3) { alert("No hay suficientes especies para este modo."); return; }
    const porRonda = Math.min(5, pool.length);
    const rondas = 3;
    let ronda = 0, puntos = 0;

    const izquierda = (e) => ({
      "foto-lat": htmlFoto(e, "planta", ""), "hoja-ca": htmlFoto(e, "hoja", ""),
      "ca-lat": `<span>${esc(e.nombres.ca)}</span>`, rasgo: `<span>${esc(e.nombres.ca)}</span>`,
    })[modo];
    const derecha = (e) => ({
      "foto-lat": `<span><i>${esc(e.nombres.lat)}</i></span>`, "ca-lat": `<span><i>${esc(e.nombres.lat)}</i></span>`,
      "hoja-ca": `<span>${esc(e.nombres.ca)}</span>`, rasgo: `<span class="rasgo">${esc(e.identificacion[0])}</span>`,
    })[modo];

    const pintarRonda = () => {
      const especies = barajar(pool).slice(0, porRonda);
      const der = barajar(especies);
      let elegido = null;   // { lado, id, el }
      let hechas = 0, fallosRonda = new Set();
      juego.innerHTML = `
        <div class="pregunta conecta-juego">
          <div class="progreso"><div style="width:${(ronda / rondas) * 100}%"></div></div>
          <div class="marcador" style="grid-template-columns:1fr 1fr">
            <div><b>${ronda + 1}/${rondas}</b><span>Ronda</span></div>
            <div><b id="c-puntos">${puntos}</b><span>Aciertos</span></div>
          </div>
          <p class="nota-dia" style="margin:0 0 12px">Toca un elemento de cada columna para unirlos con un hilo.</p>
          <div class="conecta ${modo === "rasgo" ? "con-rasgos" : ""}">
            <svg class="hilos" aria-hidden="true"></svg>
            <div class="columna izq">${especies.map((e) => `<button class="nodo ${modo.startsWith("foto") || modo === "hoja-ca" ? "con-foto" : ""}" data-lado="izq" data-id="${esc(e.id)}">${izquierda(e)}<span class="punto-hilo"></span></button>`).join("")}</div>
            <div class="columna der">${der.map((e) => `<button class="nodo" data-lado="der" data-id="${esc(e.id)}"><span class="punto-hilo"></span>${derecha(e)}</button>`).join("")}</div>
          </div>
          <div id="explicacion"></div>
        </div>`;

      const cont = $(".conecta", juego);
      const svg = $(".hilos", cont);
      const uniones = []; // { a, b, clase }

      const punto = (el, lado) => {
        const rc = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: (lado === "izq" ? r.right : r.left) - rc.left, y: r.top + r.height / 2 - rc.top };
      };
      const trazado = (a, b) => {
        const p = punto(a, "izq"), q = punto(b, "der");
        const dx = (q.x - p.x) * 0.5;
        return `M${p.x},${p.y} C${p.x + dx},${p.y} ${q.x - dx},${q.y} ${q.x},${q.y}`;
      };
      const redibujar = () => {
        svg.setAttribute("viewBox", `0 0 ${cont.clientWidth} ${cont.clientHeight}`);
        $$("path", svg).forEach((path, i) => { const u = uniones[i]; if (u) path.setAttribute("d", trazado(u.a, u.b)); });
      };
      const dibujarHilo = (a, b, clase) => {
        svg.setAttribute("viewBox", `0 0 ${cont.clientWidth} ${cont.clientHeight}`);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", trazado(a, b));
        path.setAttribute("class", "hilo " + clase);
        svg.appendChild(path);
        const largo = path.getTotalLength();
        path.style.strokeDasharray = largo;
        path.style.strokeDashoffset = largo;
        requestAnimationFrame(() => { path.style.strokeDashoffset = 0; });
        const u = { a, b, clase };
        uniones.push(u);
        return { path, u };
      };
      window.addEventListener("resize", redibujar);

      juego.onclick = (ev) => {
        const n = ev.target.closest(".nodo");
        if (n && !n.classList.contains("hecho")) {
          if (!elegido || elegido.lado === n.dataset.lado) {
            $$(".nodo.elegido", cont).forEach((x) => x.classList.remove("elegido"));
            elegido = { lado: n.dataset.lado, id: n.dataset.id, el: n };
            n.classList.add("elegido");
            return;
          }
          const a = elegido.lado === "izq" ? elegido.el : n;
          const b = elegido.lado === "izq" ? n : elegido.el;
          elegido.el.classList.remove("elegido");
          elegido = null;
          const bien = a.dataset.id === b.dataset.id;
          const { path, u } = dibujarHilo(a, b, bien ? "bien" : "mal");
          if (bien) {
            a.classList.add("hecho"); b.classList.add("hecho");
            hechas++;
            if (!fallosRonda.has(a.dataset.id)) { puntos++; registrarRespuesta(a.dataset.id, true); }
            $("#c-puntos").textContent = puntos;
            if (hechas === especies.length) {
              marcarDiaEstudio();
              window.removeEventListener("resize", redibujar);
              $("#explicacion").innerHTML = `
                <div class="explicacion"><strong>¡Ronda completada!</strong> ${fallosRonda.size ? `Has fallado ${fallosRonda.size} a la primera.` : "¡Sin ningún fallo!"}</div>
                <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${ronda + 1 < rondas ? "Siguiente ronda" : "Ver resultado"}</button></div>`;
            }
          } else {
            [a, b].forEach((x) => { x.classList.add("error"); setTimeout(() => x.classList.remove("error"), 500); });
            if (!fallosRonda.has(a.dataset.id)) { fallosRonda.add(a.dataset.id); registrarRespuesta(a.dataset.id, false); }
            setTimeout(() => { path.classList.add("desvanece"); setTimeout(() => { path.remove(); uniones.splice(uniones.indexOf(u), 1); }, 350); }, 650);
          }
          return;
        }
        if (ev.target.closest("[data-siguiente]")) {
          ronda++;
          if (ronda < rondas) { pintarRonda(); window.scrollTo(0, 0); }
          else pantallaResultado(puntos, rondas * porRonda, "recordConecta", empezarConecta);
        }
      };
    };
    cabeceraJuego(true);
    pintarRonda();
  }

  /* ---------- FOTO MISTERIOSA ---------- */
  function opcionesMisterio() { pantallaOpciones("Foto misteriosa", "", empezarMisterio); }

  function empezarMisterio() {
    const pool = especiesDeGrupo(opcionesGuardadas.grupo).filter((e) => e.fotos?.planta);
    if (pool.length < 4) { alert("Se necesitan al menos 4 especies con foto."); return; }
    let orden = [];
    while (orden.length < 8) orden.push(...barajar(pool));
    const preguntas = orden.slice(0, 8).map((e) => {
      const tipos = TIPOS_FOTO.map(([t]) => t).filter((t) => e.fotos?.[t]);
      return {
        e, tipo: tipos[Math.floor(Math.random() * tipos.length)],
        opciones: barajar([e, ...barajar(pool.filter((x) => x.id !== e.id)).slice(0, 3)]),
        foco: `${20 + Math.random() * 60}% ${20 + Math.random() * 60}%`,
      };
    });
    const PASOS = [
      { blur: 22, zoom: 4 }, { blur: 14, zoom: 3 }, { blur: 8, zoom: 2.2 }, { blur: 3, zoom: 1.5 }, { blur: 0, zoom: 1 },
    ];
    let n = 0, puntos = 0, paso = 0, reloj = null;
    const parar = () => { clearInterval(reloj); reloj = null; };

    const aplicarPaso = () => {
      const img = $(".misterio img", juego);
      if (!img) return;
      const p = PASOS[paso];
      img.style.filter = `blur(${p.blur}px)`;
      img.style.transform = `scale(${p.zoom})`;
      $("#m-valor").textContent = `${PASOS.length - paso} pts`;
      $$(".nivel i", juego).forEach((x, i) => x.classList.toggle("on", i < PASOS.length - paso));
    };

    const pintar = () => {
      const p = preguntas[n];
      paso = 0;
      juego.innerHTML = `
        <div class="pregunta">
          <div class="progreso"><div style="width:${(n / preguntas.length) * 100}%"></div></div>
          <div class="marcador">
            <div><b>${n + 1}/${preguntas.length}</b><span>Foto</span></div>
            <div><b>${puntos}</b><span>Puntos</span></div>
            <div><b id="m-valor">${PASOS.length} pts</b><span>Vale ahora</span></div>
          </div>
          <div class="misterio">
            <img src="${esc(p.e.fotos[p.tipo])}" alt="Foto misteriosa" style="transform-origin:${p.foco}">
            <div class="nivel">${PASOS.map(() => "<i class='on'></i>").join("")}</div>
          </div>
          <h2>¿Qué especie es?</h2>
          <div class="respuestas">
            ${p.opciones.map((o) => `<button data-id="${esc(o.id)}">${esc(o.nombres.ca)}<small>${esc(o.nombres.lat)}</small></button>`).join("")}
          </div>
          <button class="enlace pista" data-pista>Aclarar ya (vale menos)</button>
          <div id="explicacion"></div>
        </div>`;
      aplicarPaso();
      parar();
      reloj = setInterval(() => {
        if (paso < PASOS.length - 1) { paso++; aplicarPaso(); } else parar();
      }, 3000);
    };

    const revelar = () => { paso = PASOS.length - 1; aplicarPaso(); parar(); };

    juego.onclick = (ev) => {
      if (ev.target.closest("[data-pista]")) {
        if (paso < PASOS.length - 1) { paso++; aplicarPaso(); }
        return;
      }
      const b = ev.target.closest(".respuestas button");
      if (b && !b.disabled) {
        const p = preguntas[n];
        const bien = b.dataset.id === p.e.id;
        const valor = PASOS.length - paso;
        if (bien) puntos += valor;
        registrarRespuesta(p.e.id, bien);
        revelar();
        $$(".respuestas button", juego).forEach((x) => {
          x.disabled = true;
          if (x.dataset.id === p.e.id) x.classList.add("bien");
          else if (x === b) x.classList.add("mal");
        });
        $("[data-pista]", juego).hidden = true;
        $("#explicacion").innerHTML = `
          <div class="explicacion"><strong>${bien ? `¡Correcto! +${valor} puntos` : "¡Casi!"}</strong> Es <b>${esc(p.e.nombres.ca)}</b> (<i>${esc(p.e.nombres.lat)}</i>) — ${esc(TIPOS_FOTO.find(([t]) => t === p.tipo)[1].toLowerCase())}.</div>
          <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${n + 1 < preguntas.length ? "Siguiente" : "Ver resultado"}</button></div>`;
        return;
      }
      if (ev.target.closest("[data-siguiente]")) {
        n++;
        if (n < preguntas.length) { pintar(); window.scrollTo(0, 0); }
        else { parar(); pantallaResultado(puntos, preguntas.length * PASOS.length, "recordMisterio", empezarMisterio); }
      }
    };
    cabeceraJuego(true);
    pintar();
    // Si se sale del juego, parar el reloj
    btnSalir.addEventListener("click", parar, { once: true });
  }

  /* ---------- ESCRIBE EL NOMBRE ---------- */
  const MODOS_ESCRIBE = [["lat", "Científico"], ["ca", "Catalán"], ["es", "Castellano"], ["todos", "Los tres"]];
  function opcionesEscribe() {
    const actual = MODOS_ESCRIBE.some(([m]) => m === opcionesGuardadas.modoEscribe) ? opcionesGuardadas.modoEscribe : "lat";
    opcionesGuardadas.modoEscribe = actual;
    pantallaOpciones("Escribe el nombre", `<div><span>¿Qué nombre?</span>${chipsOpcion("modoEscribe", MODOS_ESCRIBE, actual)}</div>`, empezarEscribe);
  }

  // Distancia de edición (para perdonar pequeñas faltas)
  function distancia(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const limpio = (s) => norm(s).replace(/[^a-z0-9·\s]/g, " ").replace(/·/g, "").replace(/\s+/g, " ").trim();
  /** "bien" (exacto sin tildes), "casi" (1–2 letras de diferencia) o "mal" */
  function corregir(escrito, correcto) {
    const a = limpio(escrito), b = limpio(correcto);
    if (!a) return "mal";
    if (a === b) return "bien";
    const tolerancia = b.length > 12 ? 2 : 1;
    return distancia(a, b) <= tolerancia ? "casi" : "mal";
  }

  function empezarEscribe() {
    const modo = opcionesGuardadas.modoEscribe || "lat";
    const campos = modo === "todos" ? ["ca", "es", "lat"] : [modo];
    const etiquetas = { ca: "Nombre en catalán", es: "Nombre en castellano", lat: "Nombre científico" };
    const pool = especiesDeGrupo(opcionesGuardadas.grupo).filter((e) => e.fotos?.planta);
    if (!pool.length) { alert("No hay especies con foto."); return; }
    let orden = [];
    while (orden.length < 8) orden.push(...barajar(pool));
    const preguntas = orden.slice(0, 8).map((e) => {
      const tipos = ["planta", "hoja"].filter((t) => e.fotos?.[t]);
      return { e, tipo: tipos[Math.floor(Math.random() * tipos.length)] };
    });
    let n = 0, puntos = 0;

    const pintar = () => {
      const p = preguntas[n];
      juego.innerHTML = `
        <div class="pregunta">
          <div class="progreso"><div style="width:${(n / preguntas.length) * 100}%"></div></div>
          <div class="marcador" style="grid-template-columns:1fr 1fr">
            <div><b>${n + 1}/${preguntas.length}</b><span>Foto</span></div>
            <div><b>${puntos}</b><span>Aciertos</span></div>
          </div>
          <div data-zoom>${htmlFoto(p.e, p.tipo, "¿Qué especie es?")}</div>
          <form class="escribe" autocomplete="off">
            ${campos.map((c, i) => `
              <label>${etiquetas[c]}
                <input name="${c}" ${i === 0 ? "autofocus" : ""} autocapitalize="${c === "lat" ? "words" : "sentences"}" spellcheck="false" placeholder="${c === "lat" ? "Género especie" : "Escribe…"}">
                <span class="correccion" data-campo="${c}"></span>
              </label>`).join("")}
            <div class="vf-botones">
              <button type="button" class="btn" data-nolase>No lo sé</button>
              <button type="submit" class="btn principal">Comprobar</button>
            </div>
          </form>
          <div id="explicacion"></div>
        </div>`;
      setTimeout(() => $(".escribe input", juego)?.focus(), 300);
    };

    const comprobar = (rendirse) => {
      const p = preguntas[n];
      const form = $(".escribe", juego);
      if (form.dataset.hecho) return;
      form.dataset.hecho = "1";
      let todoBien = true;
      for (const c of campos) {
        const input = form.elements[c];
        const r = rendirse ? "mal" : corregir(input.value, p.e.nombres[c]);
        if (r === "mal") todoBien = false;
        input.disabled = true;
        input.classList.add(r);
        $(`[data-campo="${c}"]`, form).innerHTML =
          r === "bien" ? "✓ Correcto"
          : r === "casi" ? `✓ Casi: se escribe <b>${esc(p.e.nombres[c])}</b>`
          : `✗ Era <b>${esc(p.e.nombres[c])}</b>`;
      }
      if (todoBien) puntos++;
      registrarRespuesta(p.e.id, todoBien);
      $$(".vf-botones", form).forEach((x) => x.remove());
      $("#explicacion").innerHTML = `
        <div class="explicacion"><strong>${todoBien ? "¡Correcto!" : "¡A repasar!"}</strong> ${esc(p.e.nombres.ca)} · ${esc(p.e.nombres.es)} · <i>${esc(p.e.nombres.lat)}</i></div>
        <div class="dorso-botones"><button class="btn principal" data-siguiente style="flex:1">${n + 1 < preguntas.length ? "Siguiente" : "Ver resultado"}</button></div>`;
      setTimeout(() => $("[data-siguiente]", juego)?.focus(), 100);
    };

    juego.onsubmit = (ev) => { ev.preventDefault(); comprobar(false); };
    juego.onclick = (ev) => {
      if (ev.target.closest("[data-zoom] img")) { verFoto(ev.target.closest("img").src); return; }
      if (ev.target.closest("[data-nolase]")) { comprobar(true); return; }
      if (ev.target.closest("[data-siguiente]")) {
        n++;
        if (n < preguntas.length) { pintar(); window.scrollTo(0, 0); }
        else { juego.onsubmit = null; pantallaResultado(puntos, preguntas.length, "recordEscribe", empezarEscribe); }
      }
    };
    cabeceraJuego(true);
    pintar();
  }

  /* =========================================================
   * IDENTIFICA — reconocer una planta con la cámara (Pl@ntNet)
   * ========================================================= */
  const ICONO_CHECK = `<svg class="ico"><use href="#i-check"/></svg>`;
  const ICONO_INFO = `<svg class="ico"><use href="#i-info"/></svg>`;
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
      <div class="escaner">
        <img src="${foto}" alt="Tu foto">
        <span class="esquinas" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="linea-escaneo" aria-hidden="true"></span>
        <div class="escaner-pie">
          <span class="pulso"></span>
          <div><strong>Identificando…</strong><small>Comparando con miles de especies</small></div>
        </div>
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
    if (img) verFoto(img.src, img.closest(".fotos-id"));
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
      avisoToast(pos ? "Guardado en tus hallazgos 📍" : "Guardado (sin ubicación, no saldrá en el mapa)");
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

  function reducirImagen(archivo, max = 900) {
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
          ok(c.toDataURL("image/jpeg", 0.75));
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
        <label>Follaje<select name="follaje">${opciones(["", "perenne", "caduco", "semicaduco"], e.follaje)}</select></label>
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
    a.download = `herbolario-${new Date().toISOString().slice(0, 10)}.json`;
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
    pintarPuntoRecordatorio();
    guardarKV("ultimoDiaEstudio", ls.get("diasEstudio", []).slice(-1)[0] ?? null);
    asegurarAvisos();
    if (!ls.get("bienvenidaVista", false)) setTimeout(mostrarBienvenida, 500);
    $("#btn-clave").hidden = !remoto || !CFG.CLAVE_REQUERIDA;
    $("#btn-sync").hidden = !remoto;
    pintarEstadoSync();
    // Traer lo último de la base compartida al abrir, al recuperar la conexión
    // y al volver a la app (p. ej. al cambiar de app en el móvil).
    sincronizar();
    // Con la app abierta, mirar cada minuto si otros han añadido o cambiado especies
    setInterval(() => { if (!document.hidden) sincronizar(); }, 60000);
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
