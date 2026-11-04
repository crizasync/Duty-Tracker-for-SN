const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeLocation, dutyHours } = require("../utils/dutyLocation");
const queries = [];
let rows = [{ id: 11 }];
require.cache[require.resolve("../config/db")] = { exports: { query: async (sql, params) => { queries.push({ sql, params }); return { rows }; } } };
const controller = require("./dutyLogController");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const body = { dutyDate: "2026-11-04", hospital: "Hospital A", ward: "ER", shift: "Night", timeIn: "22:00", timeOut: "06:00" };

test("location is optional and malformed coordinate pairs are rejected", () => {
  assert.deepEqual(normalizeLocation(null), [null, null, null, null]);
  assert.deepEqual(normalizeLocation({ latitude: 0, longitude: 0 }), [0, 0, "", ""]);
  for (const location of [{ latitude: null, longitude: 1 }, { latitude: 91, longitude: 1 }, { latitude: 1 }, { latitude: false, longitude: 0 }]) assert.throws(() => normalizeLocation(location), { status: 400 });
  assert.equal(dutyHours("22:00", "06:00"), 8);
});

test("creating logs saves optional locations and an idempotency id scoped to the student", async () => {
  const res = response();
  await controller.createDutyLog({ user: { id: "student-1" }, body: { ...body, clientEntryId: "550e8400-e29b-41d4-a716-446655440000", facilityLocation: { latitude: 14.5, longitude: 121, address: "City", placeId: "W:10" } } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(queries.at(-1).params[0], "student-1");
  assert.equal(queries.at(-1).params[7], 8);
  assert.deepEqual(queries.at(-1).params.slice(9, 13), [14.5, 121, "City", "W:10"]);
  assert.match(queries.at(-1).sql, /ON CONFLICT \(user_id, client_entry_id\)/);
});

test("a duty without a map location still saves", async () => {
  const res = response();
  await controller.createDutyLog({ user: { id: "student-1" }, body }, res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(queries.at(-1).params.slice(9), [null, null, null, null, null]);
});

test("updates preserve omitted location data, permit clearing, and enforce ownership", async () => {
  const req = { user: { id: "student-1" }, params: { id: 11 }, body };
  await controller.updateDutyLog(req, response());
  assert.equal(queries.at(-1).params[12], false);
  assert.deepEqual(queries.at(-1).params.slice(13), [11, "student-1"]);
  assert.match(queries.at(-1).sql, /WHEN hospital::text IS DISTINCT FROM \$2::text THEN NULL/);
  await controller.updateDutyLog({ ...req, body: { ...body, facilityLocation: null } }, response());
  assert.equal(queries.at(-1).params[12], true);
  rows = [];
  const res = response();
  await controller.updateDutyLog(req, res);
  assert.equal(res.statusCode, 404);
  rows = [{ id: 11 }];
});

test("map records use only the signed-in student's duty logs", async () => {
  await controller.getDutyLogs({ user: { id: "student-2" }, query: {} }, response());
  assert.match(queries.at(-1).sql, /WHERE user_id = \$1/);
  assert.deepEqual(queries.at(-1).params, ["student-2"]);
});
