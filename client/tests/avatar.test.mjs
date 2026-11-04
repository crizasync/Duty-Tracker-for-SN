import test from "node:test";
import assert from "node:assert/strict";
import { getAvatarUrl } from "../src/utils/avatar.js";

test("uploaded images resolve at the server origin, outside the API route", () => {
  assert.equal(getAvatarUrl("/uploads/avatar-123.png", "http://localhost:5000/api"), "http://localhost:5000/uploads/avatar-123.png");
  assert.equal(getAvatarUrl("uploads/avatar-456.webp", "https://api.example.com/api/"), "https://api.example.com/uploads/avatar-456.webp");
});

test("absolute image URLs and their query parameters stay intact", () => {
  const url = "https://storage.example.com/photos/avatar.png?v=2";
  assert.equal(getAvatarUrl(url, "https://api.example.com/api"), url);
});

test("missing images return an empty source for the initials fallback", () => {
  assert.equal(getAvatarUrl(null, "http://localhost:5000/api"), "");
  assert.equal(getAvatarUrl("", "http://localhost:5000/api"), "");
});
