const PREFIX = `fieldbook:${self.registration.scope}:`;
const CACHE = `${PREFIX}shell-v4`;
const ASSETS = ['./', 'index.html', 'style.css', 'app.js', 'api.js', 'queue.js', 'mode.js', 'demo.js', 'manifest.webmanifest', 'icon.svg']
  .map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  // Only exact shell URLs: no API, private evidence, configuration, or query URLs.
  if (event.request.method !== 'GET' || !ASSETS.includes(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request.url)) || fetch(event.request)));
});
