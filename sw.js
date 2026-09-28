/* =========================================================
 * Service worker: permite instalar la app y usarla sin conexión.
 *  - Código (html, js, css): primero red -> siempre la última versión
 *    si hay internet; si no, la guardada.
 *  - Fotos: primero caché (se descargan todas al instalar).
 * Cambia VERSION cada vez que publiques cambios en las fotos.
 * ========================================================= */
const VERSION = "herbario-v2"; // no cambiarla si no cambian las fotos: obliga a volver a descargarlas

// Fotos de cada especie (planta y hoja siempre; además, las extra que tenga)
const FOTOS = {
  "phoenix-canariensis": ["fruto", "tronco"],
  "phoenix-dactylifera": ["flor", "tronco"],
  "washingtonia-robusta": ["flor", "fruto", "tronco"],
  "washingtonia-filifera": [],
  "bismarckia-nobilis": [],
  "chamaerops-humilis": ["flor", "fruto"],
  "hedera-helix": ["flor", "fruto", "tronco"],
  "parthenocissus-tricuspidata": ["fruto"],
  "ficus-pumila": ["fruto"],
  "bougainvillea-spectabilis": ["flor"],
  "wisteria-sinensis": ["flor", "fruto"],
  "jasminum-officinale": [],
  "plumbago-auriculata": ["flor", "fruto"],
};
const PRECARGA = [
  "./", "index.html", "css/estilos.css", "js/config.js", "js/datos.js", "js/app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  ...Object.entries(FOTOS).flatMap(([id, extra]) => ["planta", "hoja", ...extra].map((t) => `img/${id}-${t}.jpg`)),
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(PRECARGA.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k.startsWith("herbario-")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function primeroRed(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("index.html"));
  }
}

async function primeroCache(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

/* ---------------- Recordatorio diario ----------------
 * El navegador despierta al service worker de vez en cuando
 * (Periodic Background Sync, Android con la app instalada).
 * Si ya es la hora elegida, hoy no has estudiado y aún no se ha
 * avisado hoy, muestra una notificación.
 */
function leerKV(clave) {
  return new Promise((ok) => {
    const req = indexedDB.open("botanica-db", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("hallazgos")) db.createObjectStore("hallazgos", { keyPath: "id" });
    };
    req.onerror = () => ok(undefined);
    req.onsuccess = () => {
      try {
        const r = req.result.transaction("kv").objectStore("kv").get(clave);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ok(undefined);
      } catch { ok(undefined); }
    };
  });
}
function escribirKV(clave, valor) {
  return new Promise((ok) => {
    const req = indexedDB.open("botanica-db", 2);
    req.onerror = () => ok();
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction("kv", "readwrite");
        tx.objectStore("kv").put(valor, clave);
        tx.oncomplete = () => ok();
        tx.onerror = () => ok();
      } catch { ok(); }
    };
  });
}
const numeroDeDia = (f = new Date()) => Math.floor(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) / 86400000);

async function quizasAvisar() {
  const cfg = await leerKV("recordatorio");
  if (!cfg?.activo) return;
  const ahora = new Date();
  const hoy = numeroDeDia(ahora);
  if (ahora.getHours() < cfg.hora) return;                     // todavía no es la hora
  if ((await leerKV("ultimoDiaEstudio")) === hoy) return;      // hoy ya has estudiado
  if ((await leerKV("ultimoAviso")) === hoy) return;           // hoy ya se avisó
  await self.registration.showNotification("Herbario 🌿", {
    body: "Hay una especie nueva esperándote. ¿Te la sabes? No pierdas la racha.",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "recordatorio",
    renotify: false,
  });
  await escribirKV("ultimoAviso", hoy);
}

self.addEventListener("periodicsync", (ev) => {
  if (ev.tag === "recordatorio-diario") {
    ev.waitUntil(Promise.all([
      quizasAvisar(),
      // Aprovechar para actualizar la app en segundo plano
      caches.open(VERSION).then((c) => Promise.all(["./", "index.html", "js/app.js", "js/datos.js", "css/estilos.css"]
        .map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.ok && c.put(u, r)).catch(() => {})))),
    ]));
  }
});

self.addEventListener("notificationclick", (ev) => {
  ev.notification.close();
  ev.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const v of ventanas) {
      if ("focus" in v) return v.focus();
    }
    return self.clients.openWindow("./");
  })());
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Base de datos online: nunca desde caché (la app guarda su propia copia)
  if (url.hostname.endsWith("supabase.co")) return;

  // Tipografía de Google: caché
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    ev.respondWith(primeroCache(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.destination === "image") ev.respondWith(primeroCache(req));
  else ev.respondWith(primeroRed(req));
});
