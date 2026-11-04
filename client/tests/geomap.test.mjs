import test from "node:test";
import assert from "node:assert/strict";
import { calculateHours, groupFacilities, newDutyEntryId, validCoordinates } from "../src/utils/geoMap.js";
import { createDutyStore } from "../src/utils/dutyStore.js";

const shift = { dutyDate: "2026-11-04", hospital: "Hospital A", ward: "ER", shift: "Night", timeIn: "22:00", timeOut: "06:00", facilityLocation: { latitude: 14.5, longitude: 121, address: "Manila", placeId: "W:100" } };
function storage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value) };
}
function options(overrides = {}) { return { storage: storage(), userId: "student-1", send: async (data) => ({ data: { dutyLog: { id: 123, client_entry_id: data.clientEntryId, total_hours: 8 } } }), uuid: () => "entry-1", ...overrides }; }

test("map groups repeat visits, totals hours, and keeps unmapped logs out of markers", () => {
  const base = { hospital: "Hospital A", facility_latitude: "14.5", facility_longitude: "121", facility_place_id: "W:100" };
  const { facilities, unmapped } = groupFacilities([{ ...base, id: 1, total_hours: "8.50" }, { ...base, id: 2, hospital: "Hospital A ER", total_hours: 4 }, { id: 3, hospital: "No location", total_hours: 6, facility_latitude: null, facility_longitude: null }]);
  assert.equal(facilities.length, 1);
  assert.equal(facilities[0].totalHours, 12.5);
  assert.deepEqual(facilities[0].logs.map((log) => log.id), [1, 2]);
  assert.equal(unmapped.length, 1);
});

test("same-name hospitals in different cities stay separate; zero is a valid coordinate", () => {
  const result = groupFacilities([{ hospital: "General Hospital", facility_latitude: 0, facility_longitude: 0, total_hours: 2 }, { hospital: "General Hospital", facility_latitude: 14, facility_longitude: 121, total_hours: 3 }]);
  assert.equal(result.facilities.length, 2);
  for (const pair of [[null, null], ["", ""], [91, 0], [0, 181], [false, true], ["x", 12]]) assert.equal(validCoordinates(...pair), false);
});

test("overnight and ordinary shifts use the same hours offline", () => {
  assert.equal(calculateHours("22:00", "06:00"), 8);
  assert.equal(calculateHours("08:30:00", "17:00:00"), 8.5);
  assert.throws(() => calculateHours("25:00", "06:00"));
});

test("offline shifts retain facility coordinates and sync exactly once with a stable id", async () => {
  let connected = false; const sent = [];
  const records = createDutyStore(options({ online: () => connected, send: async (data) => { sent.push(data); return { data: { dutyLog: { id: 7, client_entry_id: data.clientEntryId, total_hours: 8 } } }; } }));
  const response = await records.create(shift);
  assert.equal(response.data.pending, true);
  assert.equal(records.cached()[0].facility_latitude, 14.5);
  assert.equal(records.cached()[0].total_hours, 8);
  connected = true;
  await Promise.all([records.sync(), records.sync()]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].clientEntryId, "entry-1");
  assert.equal(records.pending().length, 0);
  assert.equal(records.cached()[0].id, 7);
});

test("network failures preserve drafts; server validation errors return to the form", async () => {
  const network = createDutyStore(options({ send: async () => { throw new Error("offline"); } }));
  assert.equal((await network.create(shift)).data.pending, true);
  const invalid = createDutyStore(options({ send: async () => { throw { response: { status: 400 } }; } }));
  await assert.rejects(invalid.create(shift));
  assert.equal(invalid.pending().length, 0);
});

test("queued records are isolated by student and server replies do not duplicate them", async () => {
  const shared = storage();
  const first = createDutyStore(options({ storage: shared, online: () => false }));
  const second = createDutyStore(options({ storage: shared, userId: "student-2", online: () => false }));
  await first.create(shift);
  assert.equal(second.cached().length, 0);
  assert.equal(first.merge([{ id: 100, client_entry_id: "entry-1" }]).length, 1);
  first.discard("pending:entry-1");
  assert.equal(first.pending().length, 0);
});

test("device storage failure does not block an online save", async () => {
  const records = createDutyStore(options({ storage: { getItem: () => null, setItem: () => { throw new Error("quota"); } } }));
  assert.equal((await records.create(shift)).data.dutyLog.id, 123);
});

test("offline entry ids work on local HTTP phone connections without randomUUID", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const original = globalThis.crypto;
  try {
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { getRandomValues: original.getRandomValues.bind(original) } });
    const id = newDutyEntryId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(id, newDutyEntryId());
  } finally { Object.defineProperty(globalThis, "crypto", descriptor); }
});
