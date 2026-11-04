const { test } = require("node:test");
const assert = require("node:assert/strict");
const { corsOptions } = require("./cors");

test("deployed frontend URL accepts whitespace, trailing slash and multiple explicit origins", () => {
  const cors = corsOptions(" https://app.example/ , https://preview.example ");
  for (const origin of [undefined, "https://app.example", "https://preview.example", "http://localhost:5173"]) {
    cors.origin(origin, (error, allowed) => { assert.equal(error, null); assert.equal(allowed, true); });
  }
  for (const origin of ["https://evil.example", "https://app.example.evil.example", "http://app.example"]) {
    cors.origin(origin, error => assert.equal(error.message, "Not allowed by CORS"));
  }
});
