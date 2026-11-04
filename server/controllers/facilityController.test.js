const { test } = require("node:test");
const assert = require("node:assert/strict");
const { searchFacilities } = require("./facilityController");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("facility search requires an explicit meaningful query", async () => {
  const res = response();
  await searchFacilities({ query: { q: "ab" } }, res);
  assert.equal(res.statusCode, 400);
});

test("search returns coordinates and addresses, caches results, and throttles upstream calls", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url) => {
    calls++;
    assert.equal(url.searchParams.get("q"), "Test Hospital Test City");
    return { ok: true, json: async () => ({ features: [{ geometry: { coordinates: [121, 14.6] }, properties: { name: "Test Hospital", city: "Test City", country: "Philippines", osm_type: "W", osm_id: 123 } }, { geometry: { coordinates: [999, 999] } }] }) };
  };
  try {
    const res = response();
    await searchFacilities({ query: { q: "Test Hospital Test City" } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.facilities, [{ name: "Test Hospital", latitude: 14.6, longitude: 121, address: "Test City, Philippines", placeId: "W:123" }]);
    await searchFacilities({ query: { q: "Test Hospital Test City" } }, response());
    assert.equal(calls, 1);
    const limited = response();
    await searchFacilities({ query: { q: "Another Hospital" } }, limited);
    assert.equal(limited.statusCode, 429);
  } finally { global.fetch = originalFetch; }
});
