const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const inputGuard = require("./middleware/inputGuard");
const { loginIpLimit, loginAccountLimit, reportLimit } = require("./middleware/rateLimits");
const { pdfText, startPdf } = require("./utils/securePdf");

const queries = [];
require.cache[require.resolve("./config/db")] = { exports: { query: async (sql, params) => {
  queries.push({ sql, params });
  return { rows: [] };
} } };
const reports = require("./controllers/reportController");
const procedures = require("./controllers/procedureController");
const auth = require("./middleware/authMiddleware");
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "test-only-security-secret";

const app = express();
app.use(express.json(), inputGuard);
app.post("/login", loginIpLimit, loginAccountLimit, (req, res) => res.status(400).json({ success: false }));
app.get("/protected", auth, (req, res) => res.json({ id: req.user.id }));
app.get("/procedures", auth, procedures.getProcedures);
app.get("/pdf", auth, reportLimit, reports.generateDutyReport);
const server = app.listen(0, "127.0.0.1");
const ready = new Promise(resolve => server.on("listening", resolve));
const request = async (path, options = {}) => {
  await ready;
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
};
const bearer = (id = 7, options = {}) => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h", ...options })}` });
after(() => {
  server.close();
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("operator objects and duplicate filters are rejected before controllers", async () => {
  for (const body of [{ username: { $ne: null }, password: "password" }, { username: ["one", "two"] }, { password: { constructor: "bad" } }]) {
    const response = await request("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /Invalid/);
  }
  const response = await request("/procedures?status=one&status=two", { headers: bearer() });
  assert.equal(response.status, 400);
});

test("SQL operators in text remain bound data, with an authenticated owner filter", async () => {
  const payload = "' OR 1=1; DROP TABLE procedures; --";
  const response = await request(`/procedures?procedureName=${encodeURIComponent(payload)}`, { headers: bearer() });
  assert.equal(response.status, 200);
  const { sql, params } = queries.at(-1);
  assert.equal(sql.includes(payload), false);
  assert.match(sql, /user_id = \$1/);
  assert.deepEqual(params, [7, `%${payload}%`]);
});

test("JWT checks reject malformed headers, expiry, missing IDs and alternate algorithms", async () => {
  for (const headers of [
    {}, { Authorization: "Basic secret" }, { Authorization: "Bearer invalid" },
    bearer(7, { expiresIn: -1 }), bearer(7, { algorithm: "HS384" }),
    { Authorization: `Bearer ${jwt.sign({}, process.env.JWT_SECRET)}` },
  ]) assert.equal((await request("/protected", { headers })).status, 401);
  assert.equal((await request("/protected", { headers: bearer() })).status, 200);
});

test("verified UUID account IDs work on protected routes and remain bound owner parameters", async () => {
  const id = "62cc96cb-02b9-4f8f-a1ed-ddb1784b2326";
  const response = await request("/protected", { headers: bearer(id) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id });
  const records = await request("/procedures", { headers: bearer(id) });
  assert.equal(records.status, 200);
  assert.deepEqual(queries.at(-1).params, [id]);
});

test("signed tokens with malformed IDs or a different signing key are rejected", async () => {
  for (const id of [null, "", "not-a-uuid", "7 OR 1=1", {}, [], -1, 0, 1.5]) {
    assert.equal((await request("/protected", { headers: bearer(id) })).status, 401);
  }
  const token = jwt.sign({ id: "62cc96cb-02b9-4f8f-a1ed-ddb1784b2326" }, "different-secret", { algorithm: "HS256" });
  assert.equal((await request("/protected", { headers: { Authorization: `Bearer ${token}` } })).status, 401);
});

test("login blocks the eleventh failed attempt with retry headers", async () => {
  for (let i = 0; i < 10; i++) {
    const response = await request("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "rate.test" }) });
    assert.equal(response.status, 400);
  }
  const blocked = await request("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: " Rate.Test " }) });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

test("PDF requires login, is owner-scoped, downloads privately, and is rate limited", async () => {
  assert.equal((await request("/pdf")).status, 401);
  const response = await request("/pdf", { headers: bearer() });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.match(response.headers.get("content-disposition"), /attachment; filename="duty-report.pdf"/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(queries.at(-1).params, [7]);
  assert.match(queries.at(-1).sql, /LIMIT 1001/);
  for (let i = 0; i < 4; i++) {
    const pdf = await request("/pdf", { headers: bearer() });
    assert.equal(pdf.status, 200);
    await pdf.arrayBuffer();
  }
  assert.equal((await request("/pdf", { headers: bearer() })).status, 429);
});

test("PDF text drops control characters and caps size; oversized reports fail before streaming", () => {
  assert.equal(pdfText("safe\u0000\u0007\ntext"), "safe\ntext");
  assert.equal(pdfText("x".repeat(13000)).length, 12000);
  const res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  assert.equal(startPdf(res, "duty-report.pdf", 1001), null);
  assert.equal(res.statusCode, 413);
});
