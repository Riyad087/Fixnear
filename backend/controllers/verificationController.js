const { pool } = require("../config/db");
const { notify } = require("../models/module2Helpers");

async function apply(req, res) {
  const { full_name, business_name, service_category, phone, city, area, description, document_reference } = req.body;
  if (![full_name, business_name, service_category, phone, city, area, description].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ message: "Complete name, business, category, phone, city, area, and description." });
  }
  if (String(description).length > 3000 || (document_reference && String(document_reference).length > 255)) {
    return res.status(400).json({ message: "One or more fields are too long." });
  }
  try {
    const [providerRows] = await pool.execute("SELECT * FROM providers WHERE user_id = ?", [req.user.id]);
    if (!providerRows.length) return res.status(403).json({ message: "Create a provider profile before applying for verification." });
    const provider = providerRows[0];
    const [pending] = await pool.execute(
      "SELECT id FROM provider_verification_applications WHERE provider_id = ? AND application_status = 'pending'",
      [provider.id]
    );
    if (pending.length) return res.status(409).json({ message: "You already have a pending application." });

    const information = { full_name: full_name.trim(), business_name: business_name.trim(),
      service_category: service_category.trim(), phone: phone.trim(), city: city.trim(),
      area: area.trim(), description: description.trim() };

    const [result] = await pool.execute(
      `INSERT INTO provider_verification_applications
       (provider_id, applicant_information, document_reference, application_status)
       VALUES (?, ?, ?, 'pending')`,
      [provider.id, JSON.stringify(information), document_reference ? String(document_reference).trim() : null]
    );
    await pool.execute(
      "UPDATE providers SET business_name = ?, service_category = ?, description = ?, city = ?, area = ?, is_verified = FALSE WHERE id = ?",
      [information.business_name, information.service_category, information.description, information.city, information.area, provider.id]
    );
    const [admins] = await pool.execute("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await notify(admin.id, `Provider verification application #${result.insertId} is waiting for review.`);
    }
    res.status(201).json({ message: "Verification application submitted.", application_id: result.insertId, status: "pending" });
  } catch (error) {
    console.error("Verification apply:", error.message);
    res.status(500).json({ message: "Could not submit verification application." });
  }
}

async function myApplication(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.application_status, a.rejection_reason, a.created_at, a.updated_at, a.reviewed_at,
              a.applicant_information, p.business_name
       FROM provider_verification_applications a JOIN providers p ON p.id = a.provider_id
       WHERE p.user_id = ? ORDER BY a.created_at DESC`, [req.user.id]);
    res.json({ applications: rows });
  } catch (error) {
    console.error("My verification:", error.message);
    res.status(500).json({ message: "Could not load verification status." });
  }
}

module.exports = { apply, myApplication };
