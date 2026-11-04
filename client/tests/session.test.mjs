import test from "node:test";
import assert from "node:assert/strict";
import { clearSession, expireRejectedSession, installMobileSessionLock } from "../src/utils/session.js";

test("a rejected current token clears the session and notifies the UI", () => {
  const values = new Map([["token", "current"], ["user", '{"id":1}']]);
  const storage = { getItem: key => values.get(key), removeItem: key => values.delete(key) };
  let notified = false;
  assert.equal(expireRejectedSession({ response: { status: 401 }, config: { headers: { Authorization: "Bearer current" } } }, storage, () => { notified = true; }), true);
  assert.equal(values.size, 0);
  assert.equal(notified, true);
});

function lifecycle(mobile = true) {
  const browser = new EventTarget();
  const document = new EventTarget();
  document.visibilityState = "visible";
  browser.matchMedia = () => ({ matches: mobile });
  const timers = new Map();
  let sequence = 0;
  browser.setTimeout = callback => { timers.set(++sequence, callback); return sequence; };
  browser.clearTimeout = id => timers.delete(id);
  const values = new Map([["token", "current"], ["user", '{"id":1}'], ["duty-tracker:duty-queue:1", "pending shift"]]);
  const storage = { getItem: key => values.get(key), removeItem: key => values.delete(key) };
  let locks = 0;
  let time = 0;
  const cleanup = installMobileSessionLock({ browser, document, storage, onLock: () => locks++, now: () => time, idleMs: 100 });
  return { browser, document, values, storage, timers, cleanup, get locks() { return locks; }, advance: amount => { time += amount; } };
}

test("mobile backgrounding locks the session while retaining queued shifts", () => {
  const app = lifecycle();
  app.document.visibilityState = "hidden";
  app.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(app.values.has("token"), false);
  assert.equal(app.values.has("user"), false);
  assert.equal(app.values.has("duty-tracker:duty-queue:1"), true);
  assert.equal(app.locks, 1);
  app.cleanup();
});

test("idle mobile sessions lock even if the browser suspended the timer", () => {
  const app = lifecycle();
  app.advance(101);
  app.document.dispatchEvent(new Event("pointerdown"));
  assert.equal(app.locks, 1);
  assert.equal(app.values.has("token"), false);
  app.cleanup();
});

test("mobile page exits and back-cache restores lock; cleanup removes listeners", () => {
  const app = lifecycle();
  app.browser.dispatchEvent(new Event("pagehide"));
  assert.equal(app.locks, 1);
  const restore = new Event("pageshow");
  Object.defineProperty(restore, "persisted", { value: true });
  app.browser.dispatchEvent(restore);
  assert.equal(app.locks, 2);
  app.cleanup();
  app.browser.dispatchEvent(new Event("pagehide"));
  assert.equal(app.locks, 2);
  assert.equal(app.timers.size, 0);
});

test("desktop sessions survive backgrounding and inactivity", () => {
  const app = lifecycle(false);
  app.browser.dispatchEvent(new Event("pagehide"));
  app.document.visibilityState = "hidden";
  app.document.dispatchEvent(new Event("visibilitychange"));
  for (const callback of app.timers.values()) callback();
  assert.equal(app.locks, 0);
  assert.equal(app.values.get("token"), "current");
  app.cleanup();
});

test("fresh-launch session clearing preserves offline data", () => {
  const app = lifecycle();
  clearSession(app.storage);
  assert.equal(app.values.size, 1);
  app.cleanup();
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
