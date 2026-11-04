// Real database smoke check. All fixture rows are rolled back, including on failure.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const pool = require("../config/db");

async function verify() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    require.cache[require.resolve("../config/db")] = { exports: { query: (...args) => client.query(...args) } };
    const controller = require("../controllers/dutyLogController");
    const createUser = () => client.query("INSERT INTO users(full_name, username, password) VALUES($1,$2,$3) RETURNING id", ["GeoMap temporary verification", `geomap_check_${randomBytes(6).toString("hex")}`, "temporary-test-only"]);
    const user = { id: (await createUser()).rows[0].id };
    const other = { id: (await createUser()).rows[0].id };
    const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
    const body = { dutyDate: "2026-11-04", hospital: "GeoMap check hospital", ward: "ER", shift: "Night", timeIn: "22:00", timeOut: "06:00", remarks: "temporary verification", clientEntryId: randomUUID(), facilityLocation: { latitude: 14.5, longitude: 121, address: "Test facility", placeId: "test:facility" } };
    const saved = response();
    await controller.createDutyLog({ user, body }, saved);
    assert.equal(saved.statusCode, 201);
    const log = saved.body.dutyLog;
    assert.equal(Number(log.facility_latitude), 14.5);
    assert.equal(Number(log.total_hours), 8);
    const retry = response();
    await controller.createDutyLog({ user, body }, retry);
    assert.equal(retry.body.dutyLog.id, log.id);
    const own = response();
    await controller.getDutyLogs({ user, query: {} }, own);
    assert.equal(own.body.dutyLogs.length, 1);
    const foreign = response();
    await controller.updateDutyLog({ user: other, params: { id: log.id }, body }, foreign);
    assert.equal(foreign.statusCode, 404);
    const { facilityLocation, ...legacy } = body;
    const preserved = response();
    await controller.updateDutyLog({ user, params: { id: log.id }, body: legacy }, preserved);
    assert.equal(Number(preserved.body.dutyLog.facility_latitude), 14.5);
    const renamed = response();
    await controller.updateDutyLog({ user, params: { id: log.id }, body: { ...legacy, hospital: "A different hospital" } }, renamed);
    assert.equal(renamed.body.dutyLog.facility_latitude, null);
    const unlocated = response();
    await controller.createDutyLog({ user, body: { ...legacy, clientEntryId: randomUUID() } }, unlocated);
    assert.equal(unlocated.statusCode, 201);
    assert.equal(unlocated.body.dutyLog.facility_latitude, null);
    console.log("GeoMap database check passed: optional locations, retry deduplication, ownership, and location clearing.");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
}
verify().catch((error) => { console.error("GeoMap database check failed:", error.code || error.message); process.exitCode = 1; }).finally(() => pool.end());
