/* =========================================================
 * Service worker: permite instalar la app y usarla sin conexión.
 *  - Código (html, js, css): primero red -> siempre la última versión
 *    si hay internet; si no, la guardada.
 *  - Fotos: primero caché (se descargan todas al instalar).
 * Cambia VERSION cada vez que publiques cambios en las fotos.
 * ========================================================= */
const VERSION = "herbario-v2";

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
