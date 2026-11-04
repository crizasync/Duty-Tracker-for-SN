import test from "node:test";
import assert from "node:assert/strict";
import { expireRejectedSession } from "../src/utils/session.js";

test("a rejected current token clears the session and notifies the UI", () => {
  const values = new Map([["token", "current"], ["user", '{"id":1}']]);
  const storage = { getItem: key => values.get(key), removeItem: key => values.delete(key) };
  let notified = false;
  assert.equal(expireRejectedSession({ response: { status: 401 }, config: { headers: { Authorization: "Bearer current" } } }, storage, () => { notified = true; }), true);
  assert.equal(values.size, 0);
  assert.equal(notified, true);
});

test("database errors, network errors and old-account requests preserve the current session", () => {
  const storage = { getItem: () => "current", removeItem() { assert.fail("Must preserve session"); } };
  for (const error of [
    { response: { status: 500 }, config: { headers: { Authorization: "Bearer current" } } },
    { config: { headers: { Authorization: "Bearer current" } } },
    { response: { status: 401 }, config: { headers: { Authorization: "Bearer old" } } },
    { response: { status: 401 }, config: {} },
  ]) assert.equal(expireRejectedSession(error, storage, () => assert.fail("Must not notify")), false);
});
