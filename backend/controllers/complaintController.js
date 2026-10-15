const { pool } = require("../config/db");
const { notify } = require("../models/module2Helpers");
const { audit } = require("./adminController");

const validStatuses = {
  open: ["under_review", "dismissed"],
  under_review: ["awaiting_response", "resolved", "dismissed", "open"],
  awaiting_response: ["under_review", "resolved", "dismissed"],
  resolved: [],
  dismissed: []
};

async function createComplaint(req, res) {
  const { booking_id, category, description } = req.body;
  const categories = ["provider_did_not_arrive","poor_service","unexpected_price","inappropriate_behavior","booking_dispute","misleading_information","other"];
  if (!booking_id || !categories.includes(category) || typeof description !== "string" || !description.trim() || description.trim().length > 5000) {
    return res.status(400).json({ message: "Provide a valid booking, category, and description (max 5000 characters)." });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.customer_id, b.provider_id, p.user_id AS provider_user_id
       FROM bookings b JOIN providers p ON p.id=b.provider_id WHERE b.id=?`, [Number(booking_id)]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.customer_id !== req.user.id) return res.status(403).json({ message: "You can only complain about your own booking." });
    const [existing] = await pool.execute("SELECT id FROM complaints WHERE booking_id=? AND reporter_user_id=?", [booking.id, req.user.id]);
    if (existing.length) return res.status(409).json({ message: "You already submitted a complaint for this booking." });
    const [result] = await pool.execute(
      "INSERT INTO complaints (booking_id, reporter_user_id, reported_provider_id, category, description) VALUES (?, ?, ?, ?, ?)",
      [booking.id, req.user.id, booking.provider_id, category, description.trim()]);
    await pool.execute(
      "INSERT INTO complaint_history (complaint_id, changed_by_user_id, previous_status, new_status, note) VALUES (?, ?, NULL, 'open', 'Complaint submitted')",
      [result.insertId, req.user.id]);
    const [admins] = await pool.execute("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins) await notify(admin.id, `New complaint #${result.insertId} needs review.`);
    await notify(booking.provider_user_id, `A complaint has been submitted about booking #${booking.id}.`);
    res.status(201).json({ message: "Complaint submitted.", complaint_id: result.insertId });
  } catch (error) {
    console.error("Create complaint:", error.message);
    res.status(500).json({ message: "Could not submit complaint." });
  }
}

async function myComplaints(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id,c.booking_id,c.category,c.description,c.status,c.admin_response,c.resolution_notes,
              c.created_at,c.updated_at,p.business_name
       FROM complaints c JOIN providers p ON p.id=c.reported_provider_id
       WHERE c.reporter_user_id=? ORDER BY c.created_at DESC`, [req.user.id]);
    res.json({ complaints: rows });
  } catch (error) {
    console.error("My complaints:", error.message);
    res.status(500).json({ message: "Could not load complaints." });
  }
}

async function complaintDetails(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, u.name AS reporter_name, p.business_name, b.service_category
       FROM complaints c JOIN users u ON u.id=c.reporter_user_id
       JOIN providers p ON p.id=c.reported_provider_id JOIN bookings b ON b.id=c.booking_id
       WHERE c.id=?`, [req.params.id]);
    const complaint = rows[0];
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    const isAdmin = req.user.role === "admin";
    const isReporter = complaint.reporter_user_id === req.user.id;
    const [providerRows] = await pool.execute("SELECT user_id FROM providers WHERE id=?", [complaint.reported_provider_id]);
    const isProvider = providerRows.length && providerRows[0].user_id === req.user.id;
    if (!isAdmin && !isReporter && !isProvider) return res.status(403).json({ message: "You cannot view this complaint." });
    const [history] = await pool.execute(
      "SELECT previous_status,new_status,note,created_at FROM complaint_history WHERE complaint_id=? ORDER BY created_at", [complaint.id]);
    // Internal notes are not returned in this starter implementation.
    if (!isAdmin) { delete complaint.resolution_notes; delete complaint.resolution_reason; delete complaint.assigned_admin_id; }
    res.json({ complaint, history });
  } catch (error) {
    console.error("Complaint details:", error.message);
    res.status(500).json({ message: "Could not load complaint." });
  }
}

async function adminComplaints(req, res) {
  try {
    const status = String(req.query.status || "");
    const allowed = ["open","under_review","awaiting_response","resolved","dismissed"];
    const [rows] = status && allowed.includes(status) ? await pool.execute(
      `SELECT c.id,c.booking_id,c.reporter_user_id,c.reported_provider_id,c.category,c.description,c.status,c.created_at,
              u.name AS reporter_name,p.business_name
       FROM complaints c JOIN users u ON u.id=c.reporter_user_id JOIN providers p ON p.id=c.reported_provider_id
       WHERE c.status=? ORDER BY c.created_at`, [status]) : await pool.execute(
      `SELECT c.id,c.booking_id,c.reporter_user_id,c.reported_provider_id,c.category,c.description,c.status,c.created_at,
              u.name AS reporter_name,p.business_name
       FROM complaints c JOIN users u ON u.id=c.reporter_user_id JOIN providers p ON p.id=c.reported_provider_id
       ORDER BY c.created_at`);
    res.json({ complaints: rows });
  } catch (error) {
    console.error("Admin complaints:", error.message);
    res.status(500).json({ message: "Could not load complaints." });
  }
}

async function updateComplaint(req, res) {
  const { status, admin_response, resolution_notes, reason } = req.body;
  if (!["under_review","awaiting_response","resolved","dismissed","open"].includes(status)) {
    return res.status(400).json({ message: "Invalid complaint status." });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT * FROM complaints WHERE id=? FOR UPDATE", [req.params.id]);
    const c = rows[0];
    if (!c) { await connection.rollback(); return res.status(404).json({ message: "Complaint not found." }); }
    if (!(validStatuses[c.status] || []).includes(status)) {
      await connection.rollback();
      return res.status(409).json({ message: `Cannot change complaint from ${c.status} to ${status}.` });
    }
    if (["resolved","dismissed"].includes(status) && !String(resolution_notes || reason || "").trim()) {
      await connection.rollback();
      return res.status(400).json({ message: "Resolution notes or a dismissal reason is required." });
    }
    await connection.execute(
      `UPDATE complaints SET status=?, assigned_admin_id=COALESCE(assigned_admin_id,?),
       admin_response=?, resolution_notes=?, resolution_reason=?, resolved_at=CASE WHEN ? IN ('resolved','dismissed') THEN NOW() ELSE resolved_at END
       WHERE id=?`,
      [status, req.user.id, admin_response || null, resolution_notes || null, reason || null, status, c.id]);
    await connection.execute(
      "INSERT INTO complaint_history (complaint_id,changed_by_user_id,previous_status,new_status,note) VALUES (?,?,?,?,?)",
      [c.id, req.user.id, c.status, status, String(reason || resolution_notes || admin_response || "").slice(0,1000) || null]);
    await audit(req.user.id, "complaint_status_changed", "complaint", c.id, String(reason || resolution_notes || "").slice(0,1000) || null, connection);
    await notify(c.reporter_user_id, `Complaint #${c.id} status changed to ${status.replaceAll("_"," ")}.`);
    await connection.commit();
    res.json({ message: "Complaint updated.", status });
  } catch (error) {
    await connection.rollback();
    console.error("Update complaint:", error.message);
    res.status(500).json({ message: "Could not update complaint." });
  } finally { connection.release(); }
}

module.exports = { createComplaint, myComplaints, complaintDetails, adminComplaints, updateComplaint };
