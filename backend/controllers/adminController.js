const { pool } = require("../config/db");
const { notify } = require("../models/module2Helpers");

async function audit(adminId, action, entityType, entityId, reason = null, connection = pool) {
  await connection.execute(
    "INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, entity_id, reason) VALUES (?, ?, ?, ?, ?)",
    [adminId, action, entityType, entityId || null, reason]
  );
}

async function dashboard(req, res) {
  try {
    const queries = {
      users: "SELECT COUNT(*) AS n FROM users",
      customers: "SELECT COUNT(*) AS n FROM users WHERE role='customer'",
      providers: "SELECT COUNT(*) AS n FROM providers",
      verifiedProviders: "SELECT COUNT(*) AS n FROM providers WHERE is_verified=TRUE",
      pendingApplications: "SELECT COUNT(*) AS n FROM provider_verification_applications WHERE application_status='pending'",
      rejectedApplications: "SELECT COUNT(*) AS n FROM provider_verification_applications WHERE application_status='rejected'",
      bookings: "SELECT COUNT(*) AS n FROM bookings",
      completedBookings: "SELECT COUNT(*) AS n FROM bookings WHERE status='completed'",
      cancelledBookings: "SELECT COUNT(*) AS n FROM bookings WHERE status='cancelled'",
      pendingComplaints: "SELECT COUNT(*) AS n FROM complaints WHERE status IN ('open','under_review','awaiting_response')",
      reviews: "SELECT COUNT(*) AS n FROM reviews"
    };
    const stats = {};
    for (const [key, sql] of Object.entries(queries)) {
      const [rows] = await pool.query(sql);
      stats[key] = Number(rows[0].n);
    }
    res.json({ stats });
  } catch (error) {
    console.error("Admin dashboard:", error.message);
    res.status(500).json({ message: "Could not load dashboard. Have you run the Module 3 migration?" });
  }
}

async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "").trim();
    const where = []; const values = [];
    if (search) { where.push("(name LIKE ? OR email LIKE ?)"); values.push(`%${search}%`, `%${search}%`); }
    if (["customer","provider","admin"].includes(role)) { where.push("role = ?"); values.push(role); }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM users ${clause}`, values);
    const [users] = await pool.execute(
      `SELECT id, name, email, phone, role, city, area, created_at FROM users ${clause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit]);
    res.json({ users, page, limit, total: countRows[0].total });
  } catch (error) {
    console.error("Admin users:", error.message);
    res.status(500).json({ message: "Could not load users." });
  }
}

async function listProviders(req, res) {
  try {
    const search = `%${String(req.query.search || "").trim()}%`;
    const status = String(req.query.status || "");
    let condition = "(p.business_name LIKE ? OR p.service_category LIKE ? OR p.city LIKE ? OR p.area LIKE ?)";
    const values = [search, search, search, search];
    if (status === "verified") condition += " AND p.is_verified=TRUE";
    else if (status === "unverified") condition += " AND p.is_verified=FALSE";
    const [providers] = await pool.execute(
      `SELECT p.id, p.user_id, p.business_name, p.service_category, p.city, p.area,
              p.is_verified, p.is_available, p.rating, p.total_reviews, u.name AS owner_name, u.email
       FROM providers p JOIN users u ON u.id=p.user_id WHERE ${condition}
       ORDER BY p.created_at DESC LIMIT 200`, values);
    res.json({ providers });
  } catch (error) {
    console.error("Admin providers:", error.message);
    res.status(500).json({ message: "Could not load providers." });
  }
}

async function listBookings(req, res) {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.id, b.service_category, b.problem_title, b.status, b.created_at, b.completed_at,
              cu.name AS customer_name, p.business_name, pu.name AS provider_name
       FROM bookings b JOIN users cu ON cu.id=b.customer_id
       JOIN providers p ON p.id=b.provider_id JOIN users pu ON pu.id=p.user_id
       ORDER BY b.created_at DESC LIMIT 300`);
    res.json({ bookings });
  } catch (error) {
    console.error("Admin bookings:", error.message);
    res.status(500).json({ message: "Could not load bookings." });
  }
}

async function listApplications(req, res) {
  try {
    const status = ["pending","approved","rejected","revoked"].includes(req.query.status) ? req.query.status : "pending";
    const [applications] = await pool.execute(
      `SELECT a.id, a.provider_id, a.applicant_information, a.document_reference,
              a.application_status, a.reviewed_by, a.reviewed_at, a.rejection_reason, a.created_at,
              p.business_name, p.service_category, u.name AS owner_name, u.email
       FROM provider_verification_applications a JOIN providers p ON p.id=a.provider_id
       JOIN users u ON u.id=p.user_id WHERE a.application_status = ? ORDER BY a.created_at ASC`,
      [status]);
    res.json({ applications });
  } catch (error) {
    console.error("Admin applications:", error.message);
    res.status(500).json({ message: "Could not load applications." });
  }
}

async function decideApplication(req, res) {
  const approved = req.params.decision === "approve";
  const reason = String(req.body.reason || "").trim();
  if (!approved && !reason) return res.status(400).json({ message: "A rejection reason is required." });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT * FROM provider_verification_applications WHERE id=? FOR UPDATE", [req.params.id]);
    const app = rows[0];
    if (!app) { await connection.rollback(); return res.status(404).json({ message: "Application not found." }); }
    if (app.application_status !== "pending") { await connection.rollback(); return res.status(409).json({ message: "Only pending applications can be reviewed." }); }
    const next = approved ? "approved" : "rejected";
    await connection.execute(
      "UPDATE provider_verification_applications SET application_status=?, reviewed_by=?, reviewed_at=NOW(), rejection_reason=? WHERE id=?",
      [next, req.user.id, approved ? null : reason, app.id]);
    await connection.execute("UPDATE providers SET is_verified=? WHERE id=?", [approved, app.provider_id]);
    await audit(req.user.id, `verification_${next}`, "verification_application", app.id, approved ? null : reason, connection);
    const [provider] = await connection.execute("SELECT user_id FROM providers WHERE id=?", [app.provider_id]);
    if (provider.length) await notify(provider[0].user_id,
      approved ? "Your provider verification has been approved." : `Your provider verification was rejected: ${reason}`);
    await connection.commit();
    res.json({ message: `Application ${next}.`, status: next });
  } catch (error) {
    await connection.rollback();
    console.error("Decide verification:", error.message);
    res.status(500).json({ message: "Could not review application." });
  } finally { connection.release(); }
}

async function listAuditLogs(req, res) {
  try {
    const [logs] = await pool.execute(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.reason, a.created_at, u.name AS admin_name
       FROM admin_audit_logs a JOIN users u ON u.id=a.admin_user_id ORDER BY a.created_at DESC LIMIT 200`);
    res.json({ logs });
  } catch (error) {
    console.error("Audit logs:", error.message);
    res.status(500).json({ message: "Could not load audit logs." });
  }
}


async function listReviews(req, res) {
  try {
    const visible = req.query.visible === "hidden" ? 0 : 1;
    const [reviews] = await pool.execute(
      `SELECT r.id, r.booking_id, r.rating, r.review_text, r.is_visible, r.moderation_reason,
              r.created_at, u.name AS customer_name, p.business_name
       FROM reviews r JOIN users u ON u.id=r.customer_id JOIN providers p ON p.id=r.provider_id
       WHERE r.is_visible=? ORDER BY r.created_at DESC LIMIT 200`,
      [visible]
    );
    res.json({ reviews });
  } catch (error) {
    console.error("Admin reviews:", error.message);
    res.status(500).json({ message: "Could not load reviews." });
  }
}

async function moderateReview(req, res) {
  const visible = req.params.action === "restore";
  const reason = String(req.body.reason || "").trim();
  if (!visible && !reason) return res.status(400).json({ message: "A moderation reason is required." });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT * FROM reviews WHERE id=? FOR UPDATE", [req.params.id]);
    if (!rows.length) { await connection.rollback(); return res.status(404).json({ message: "Review not found." }); }
    const review = rows[0];
    await connection.execute(
      "UPDATE reviews SET is_visible=?, moderation_reason=?, moderated_by=?, moderated_at=NOW() WHERE id=?",
      [visible, visible ? null : reason, req.user.id, review.id]);
    const [agg] = await connection.execute(
      "SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM reviews WHERE provider_id=? AND is_visible=TRUE",
      [review.provider_id]);
    await connection.execute("UPDATE providers SET rating=?, total_reviews=? WHERE id=?",
      [Number(agg[0].avg_rating || 0).toFixed(2), agg[0].total, review.provider_id]);
    await audit(req.user.id, visible ? "review_restored" : "review_hidden", "review", review.id, visible ? null : reason, connection);
    await connection.commit();
    res.json({ message: visible ? "Review restored." : "Review hidden." });
  } catch (error) {
    await connection.rollback();
    console.error("Moderate review:", error.message);
    res.status(500).json({ message: "Could not moderate review." });
  } finally { connection.release(); }
}

module.exports = { dashboard, listUsers, listProviders, listBookings, listApplications, decideApplication, listAuditLogs, listReviews, moderateReview, audit };
