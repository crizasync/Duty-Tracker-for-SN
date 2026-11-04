import test from "node:test";
import assert from "node:assert/strict";
import { resolveApiBase } from "../src/utils/apiBase.js";

test("deployment API URLs use the API mount path with or without configuration", () => {
  assert.equal(resolveApiBase(undefined), "/api");
  assert.equal(resolveApiBase("  "), "/api");
  assert.equal(resolveApiBase("https://backend.example/"), "https://backend.example/api");
  assert.equal(resolveApiBase(" https://backend.example/api/ "), "https://backend.example/api");
  assert.equal(resolveApiBase("/api/"), "/api");
  assert.equal(resolveApiBase("https://backend.example/v2/api"), "https://backend.example/v2/api");
});
