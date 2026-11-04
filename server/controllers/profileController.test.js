const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const images = new Map();
const queries = [];
const user = { id: "62cc96cb-02b9-4f8f-a1ed-ddb1784b2326", full_name: "Sample Clinician", username: "sample", avatar_url: null };
require.cache[require.resolve("../config/db")] = { exports: { query: async (sql, params) => {
  queries.push({ sql, params });
  if (sql.includes("INSERT INTO profile_images")) {
    images.clear();
    images.set(params[1], { image_data: params[3], content_type: params[2] });
    user.avatar_url = `/uploads/${params[1]}`;
  }
  if (sql.includes("SELECT image_data")) return { rows: images.has(params[0]) ? [images.get(params[0])] : [] };
  return { rows: [{ ...user }] };
} } };
const profile = require("./profileController");
const { getAvatar } = require("./avatarController");
const response = () => ({ headers: {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; }, setHeader(key, value) { this.headers[key] = value; }, send(value) { this.body = value; } });

test("image remains available after temporary upload is removed and profile is reloaded", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "duty-avatar-test-"));
  const filename = "avatar-12345678-1234-1234-1234-123456789abc.png";
  const file = path.join(directory, filename);
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  try {
    await fs.writeFile(file, bytes);
    const res = response();
    await profile.updateProfile({ user, body: { fullName: user.full_name, phoneNumber: "" }, file: { path: file, filename, mimetype: "image/png" } }, res);
    assert.equal(res.body.profile.avatar_url, `/uploads/${filename}`);
    assert.deepEqual(queries.at(-1).params[3], bytes);
    assert.equal(queries.at(-1).params.at(-1), user.id);
    await assert.rejects(fs.access(file));
    const restored = response();
    await profile.getProfile({ user }, restored);
    assert.equal(restored.body.profile.avatar_url, `/uploads/${filename}`);
    const image = response();
    await getAvatar({ params: { filename } }, image, () => assert.fail("Image must survive removal of the disk upload"));
    assert.deepEqual(image.body, bytes);
    assert.equal(image.headers["Content-Type"], "image/png");
    assert.equal(image.headers["X-Content-Type-Options"], "nosniff");
  } finally {
    await fs.rmdir(directory);
  }
});

test("editing text preserves the saved avatar without changing image storage", async () => {
  const existing = user.avatar_url;
  const res = response();
  await profile.updateProfile({ user, body: { fullName: user.full_name, phoneNumber: "123" } }, res);
  assert.equal(res.body.profile.avatar_url, existing);
  assert.doesNotMatch(queries.at(-1).sql, /INSERT INTO profile_images|avatar_url\s*=/);
});

test("missing or invalid image filenames fall back to legacy static files", async () => {
  for (const filename of ["avatar-999.png", "../private.env"]) {
    let fallback = false;
    await getAvatar({ params: { filename } }, response(), () => { fallback = true; });
    assert.equal(fallback, true);
  }
});
