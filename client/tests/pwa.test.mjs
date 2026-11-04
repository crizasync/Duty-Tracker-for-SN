import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import pwa from '../pwa-plugin.js';

function worker() {
  let source;
  pwa().generateBundle.call({ emitFile(asset) { source = asset.source; } }, {}, {
    'index.html': { source: '<html>App</html>' },
    'assets/app.js': { code: 'app()' },
    'assets/map.js': { code: 'map()' },
  });
  const handlers = {};
  const removed = [];
  let assets;
  let claimed = false;
  vm.runInNewContext(source, {
    URL,
    self: { location: { origin: 'https://duty.example' }, clients: { claim() { claimed = true; } }, addEventListener(type, callback) { handlers[type] = callback; } },
    caches: {
      open: async () => ({ addAll: async list => { assets = list; }, match: async path => `cached:${path}` }),
      keys: async () => ['duty-tracker-shell-old', 'other-app-cache'],
      delete: async key => { removed.push(key); },
    },
    fetch() { throw Error('Offline'); },
  });
  return { handlers, removed, get assets() { return assets; }, get claimed() { return claimed; } };
}

test('worker precaches shell and lazy routes, and preserves other app caches', async () => {
  const app = worker();
  await new Promise((resolve, reject) => app.handlers.install({ waitUntil: promise => promise.then(resolve, reject) }));
  assert.ok(app.assets.includes('/index.html'));
  assert.ok(app.assets.includes('/assets/map.js'));
  await new Promise((resolve, reject) => app.handlers.activate({ waitUntil: promise => promise.then(resolve, reject) }));
  assert.deepEqual(app.removed, ['duty-tracker-shell-old']);
  assert.equal(app.claimed, true);
});

test('offline deep links get the shell, while APIs and mutations bypass the worker', async () => {
  const app = worker();
  let response;
  app.handlers.fetch({ request: { method: 'GET', url: 'https://duty.example/duty-logs', mode: 'navigate' }, respondWith(promise) { response = promise; } });
  assert.equal(await response, 'cached:/index.html');
  for (const request of [
    { method: 'GET', url: 'https://duty.example/api/profile' },
    { method: 'POST', url: 'https://duty.example/api/duty-logs' },
    { method: 'GET', url: 'https://tiles.example/tile.png' },
  ]) app.handlers.fetch({ request, respondWith() { assert.fail('Must bypass worker'); } });
});

test('manifest provides standalone launch and real PNG installation icons', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const file = new URL(`../public${icon.src}`, import.meta.url);
    assert.ok(existsSync(file));
    const png = readFileSync(file);
    assert.equal(png.readUInt32BE(16), Number(icon.sizes.split('x')[0]));
    assert.equal(png.readUInt32BE(20), Number(icon.sizes.split('x')[1]));
  }
});
