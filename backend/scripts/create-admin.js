require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_CITY, ADMIN_AREA } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE in backend/.env before running this script.");
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const [rows] = await pool.execute("SELECT id, role FROM users WHERE email = ?", [email]);
  if (rows.length) {
    if (rows[0].role === "admin") {
      console.log(`An admin account already exists for ${email}. No changes made.`);
      return;
    }
    throw new Error(`This email already belongs to a ${rows[0].role} account. Use a different email; this script will not promote an existing account.`);
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.execute(
    `INSERT INTO users (name, email, password, phone, city, area, role) VALUES (?, ?, ?, ?, ?, ?, 'admin')`,
    [ADMIN_NAME.trim(), email, hash, ADMIN_PHONE.trim(), (ADMIN_CITY || "").trim(), (ADMIN_AREA || "").trim()]
  );
  console.log(`Admin account created successfully for ${email}. You can now log in through the FixNear login page.`);
}
main().catch((err) => { console.error("Admin creation failed:", err.message); process.exitCode = 1; }).finally(async () => { await pool.end(); });
