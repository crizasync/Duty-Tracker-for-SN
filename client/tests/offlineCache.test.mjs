import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineCache } from '../src/utils/offlineCache.js';

const setup = () => {
  const entries = new Map();
  return createOfflineCache({ getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) });
};
test('offline reads are isolated by account, API server and filters', () => {
  const cache = setup();
  const request = { method: 'get', baseURL: 'https://api.example.com', url: '/procedures', params: { startDate: '2026-01-01' } };
  cache.save(request, 1, { procedures: [{ id: 1 }] });
  assert.deepEqual(cache.read(request, 1).data, { procedures: [{ id: 1 }] });
  assert.equal(cache.read(request, 2), null);
  assert.equal(cache.read(request, null), null);
  assert.equal(cache.read({ ...request, params: {} }, 1), null);
  assert.equal(cache.read({ ...request, baseURL: 'https://other.example.com' }, 1), null);
});
test('mutations and report downloads cannot be replayed as cached successes', () => {
  const cache = setup();
  for (const request of [{ method: 'post', url: '/procedures' }, { method: 'put', url: '/profile' }, { method: 'delete', url: '/duty-logs/1' }, { method: 'get', url: '/reports/summary', responseType: 'blob' }]) {
    cache.save(request, 1, { success: true });
    assert.equal(cache.read(request, 1), null);
  }
});
test('unavailable browser storage does not prevent online use', () => {
  const cache = createOfflineCache({ getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } });
  const request = { method: 'get', url: '/profile' };
  assert.doesNotThrow(() => cache.save(request, 1, {}));
  assert.equal(cache.read(request, 1), null);
});
