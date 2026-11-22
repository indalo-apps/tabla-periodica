// Service worker de la Tabla periódica: permite usarla sin conexión.
// Al subir una versión nueva, cambia el nombre de la caché y se borra la anterior.
const CACHE = "tabla-periodica-1.9";
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-152.png", "icon-167.png", "icon-maskable-512.png", "favicon-32.png",
  "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u =>
    c.add(new Request(u, { mode: u.startsWith("http") ? "cors" : "same-origin" })).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("tabla-periodica-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // Comprobación de versión nueva: siempre a la red
  if (url.origin === location.origin && url.searchParams.has("v")) return;
  // La página: primero la red (lo último) y, sin conexión, la copia guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("index.html", cp)); return r; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  // Lo demás (letras, iconos): primero la copia guardada y, si no está, la red
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === "opaque")) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
