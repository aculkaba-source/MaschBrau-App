/* =====================================================================
   SERVICE WORKER – macht die App offline-fähig.
   Dateien werden zuerst aus dem Netz geladen (Änderungen kommen also
   sofort an) und nur ohne Verbindung aus dem Zwischenspeicher.
   Wenn du eine neue Datei hinzufügst: unten in DATEIEN eintragen und
   die VERSION erhöhen.
   ===================================================================== */

const VERSION = "maschbrau-v1";
const DATEIEN = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/vendor/qrcode.js",
  "js/vendor/jsQR.js",
  "js/daten.js",
  "js/grafik.js",
  "js/speicher.js",
  "js/rechnen.js",
  "js/qr.js",
  "js/app.js",
  "js/seite-start.js",
  "js/seite-shop.js",
  "js/seite-abo.js",
  "js/seite-karte.js",
  "js/seite-kasse.js",
  "js/seite-profil.js",
  "icons/favicon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Erst aus dem Netz laden (damit Änderungen sofort ankommen),
   bei fehlender Verbindung aus dem Zwischenspeicher. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(VERSION).then((c) => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
