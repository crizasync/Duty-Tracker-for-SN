import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export default function pwa() {
  return {
    name: 'duty-tracker-pwa',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle);
      const version = createHash('sha256');
      for (const file of files) version.update(bundle[file].code || bundle[file].source || '');
      const publicAssets = ['/manifest.webmanifest', '/icons/favicon.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'];
      for (const file of publicAssets) version.update(readFileSync(new URL(`./public${file}`, import.meta.url)));
      const cache = `duty-tracker-shell-${version.digest('hex').slice(0, 12)}`;
      const assets = ['/', '/index.html', ...publicAssets, ...files.map(file => `/${file}`)];
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = ${JSON.stringify(cache)};
const ASSETS = ${JSON.stringify([...new Set(assets)])};
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('duty-tracker-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // API requests stay in the account-scoped application cache, outside this worker.
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(event.request)));
  }
});
` });
    },
  };
}
