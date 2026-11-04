require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../config/db");

async function migrate() {
  const client = await pool.connect();
  try {
    if (!process.argv.includes("--geomap-only")) {
      await client.query(fs.readFileSync(path.join(__dirname, "001_usernames.sql"), "utf8"));
      await client.query(fs.readFileSync(path.join(__dirname, "002_optional_legacy_email.sql"), "utf8"));
    }
    await client.query(fs.readFileSync(path.join(__dirname, "003_geomap.sql"), "utf8"));
    console.log("Database migrations complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .catch((error) => {
    console.error("Database migration failed:", error.code || error.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
