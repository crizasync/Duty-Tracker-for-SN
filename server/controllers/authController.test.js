const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const queries = [];
let rows = [];
let insertedUser;
require.cache[require.resolve("../config/db")] = {
  exports: {
    query: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes("INSERT INTO users") && insertedUser) return { rows: [insertedUser] };
      return { rows };
    },
  },
};
const auth = require("./authController");

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("username login normalizes input and verifies the password", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret";
  try {
    rows = [{ id: 1, username: "nurse.one", email: "nurse@example.com", full_name: "Nurse One", avatar_url: "/uploads/avatar-123.png", password: bcrypt.hashSync("correct-password", 4) }];
    const res = response();
    await auth.login({ body: { username: " Nurse.One ", password: "correct-password" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.username, "nurse.one");
    assert.equal(res.body.user.avatar_url, "/uploads/avatar-123.png");
    assert.equal("email" in res.body.user, false);
    assert.equal("email" in jwt.verify(res.body.token, process.env.JWT_SECRET), false);
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).id, 1);
    assert.match(queries.at(-1).sql, /LOWER\(username\)/);
    assert.deepEqual(queries.at(-1).params, ["nurse.one"]);

    const wrongPassword = response();
    await auth.login({ body: { username: "nurse.one", password: "wrong-password" } }, wrongPassword);
    assert.equal(wrongPassword.statusCode, 400);
    assert.equal(wrongPassword.body.token, undefined);

    rows = [];
    const unknownUser = response();
    await auth.login({ body: { username: "unknown", password: "password" } }, unknownUser);
    assert.equal(unknownUser.statusCode, 400);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("registration succeeds without email and hashes the password", async () => {
  rows = [];
  insertedUser = { id: 2, full_name: "Nurse Two", username: "nurse.two" };
  try {
    const res = response();
    await auth.register({ body: { fullName: "Nurse Two", username: " Nurse.Two ", password: "Secure12" } }, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.user, insertedUser);
    const insert = queries.at(-1);
    assert.doesNotMatch(insert.sql, /email/i);
    assert.equal(insert.params[0], "Nurse Two");
    assert.equal(insert.params[2], "nurse.two");
    assert.equal(await bcrypt.compare("Secure12", insert.params[1]), true);
    assert.equal(bcrypt.getRounds(insert.params[1]), 12);
  } finally {
    insertedUser = undefined;
  }
});

test("login rejects missing usernames and email-only requests", async () => {
  for (const body of [{ email: "nurse@example.com", password: "password" }, { username: " ", password: "password" }, { username: "nurse.one" }]) {
    const res = response();
    const count = queries.length;
    await auth.login({ body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(queries.length, count);
  }
});

test("registration rejects invalid and duplicate usernames", async () => {
  const invalid = response();
  await auth.register({ body: { username: "bad name" } }, invalid);
  assert.equal(invalid.statusCode, 400);

  rows = [{ username: "nurse.one" }];
  const duplicate = response();
  await auth.register({ body: { fullName: "Nurse One", email: "nurse@example.com", username: " Nurse.One ", password: "Secure12" } }, duplicate);
  assert.equal(duplicate.statusCode, 400);
  assert.deepEqual(queries.at(-1).params, ["nurse.one"]);
});

test("registration rejects passwords below eight characters and bcrypt overflow", async () => {
  for (const password of ["short", "a".repeat(7), "a".repeat(73), "🙂".repeat(19), { $ne: null }, null]) {
    const res = response();
    const count = queries.length;
    await auth.register({ body: { fullName: "Nurse", username: "nurse.test", password } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(queries.length, count);
  }
});

test("registration accepts passwords longer than eight characters", async () => {
  rows = [];
  insertedUser = { id: 3, full_name: "Nurse Three", username: "nurse.three" };
  try {
    const password = "A-longer-password-123";
    const res = response();
    await auth.register({ body: { fullName: "Nurse Three", username: "nurse.three", password } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(await bcrypt.compare(password, queries.at(-1).params[1]), true);
  } finally {
    insertedUser = undefined;
  }
});
