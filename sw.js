// Service worker de Mapstr perso (généré par scripts/generer_pwa.py, version ecf856bd3263).
// La page s'ouvre même sans réseau (dernière version connue) ; les données du Sheet ne sont jamais mises en cache.
const CACHE = 'mapstr-ecf856bd3263', TUILES = 'mapstr-tuiles', MAX_TUILES = 800, COQUILLE = ["./", "index.html", "manifest.webmanifest", "icone-192.png", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(k => Promise.all(k.filter(n => n !== CACHE && n !== TUILES).map(n => caches.delete(n)))).then(() => self.clients.claim())));
// Tuiles OSM : le cache d'abord (la carte s'affiche hors ligne là où on est déjà allé), sinon réseau puis mise en cache ; on garde les {MAX_TUILES} plus récentes.
function tuile(q) {
  return caches.open(TUILES).then(c => c.match(q).then(r => r || fetch(q).then(n => {
    if (n.ok || n.type === 'opaque') {
      c.put(q, n.clone()).then(() => c.keys()).then(k => { if (k.length > MAX_TUILES) c.delete(k[0]); });
    }
    return n;
  })));
}
self.addEventListener('fetch', e => {
  const q = e.request, u = new URL(q.url);
  if (q.method !== 'GET') return; // appels au serveur (POST) : jamais interceptés
  if (u.origin === location.origin) // la page : le réseau d'abord, pour avoir la dernière version
    e.respondWith(fetch(q, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(q, c)); return r; })
      .catch(() => caches.match(q).then(r => r || caches.match('index.html'))));
  else if (COQUILLE.includes(q.url)) e.respondWith(caches.match(q).then(r => r || fetch(q))); // Leaflet
  else if (/^[abc]\.tile\.openstreetmap\.org$/.test(u.hostname)) e.respondWith(tuile(q));
});
