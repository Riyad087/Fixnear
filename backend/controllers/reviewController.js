const { pool } = require("../config/db");
const { notify } = require("../models/module2Helpers");

async function createReview(req, res) {
  const { booking_id, rating, review_text, service_quality_rating, punctuality_rating, communication_rating } = req.body;
  const validRating = (v) => v == null || v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5);
  if (!booking_id || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 ||
      typeof review_text !== "string" || !review_text.trim() || review_text.trim().length > 2000 ||
      ![service_quality_rating, punctuality_rating, communication_rating].every(validRating)) {
    return res.status(400).json({ message: "Provide a booking, a 1–5 rating, review text (max 2000 characters), and valid optional ratings." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT b.id, b.customer_id, b.provider_id, b.status, p.user_id AS provider_user_id
       FROM bookings b JOIN providers p ON p.id = b.provider_id WHERE b.id = ? FOR UPDATE`,
      [Number(booking_id)]
    );
    const booking = rows[0];
    if (!booking) { await connection.rollback(); return res.status(404).json({ message: "Booking not found." }); }
    if (booking.customer_id !== req.user.id) { await connection.rollback(); return res.status(403).json({ message: "You can only review your own booking." }); }
    if (booking.status !== "completed") { await connection.rollback(); return res.status(409).json({ message: "Only completed bookings can be reviewed." }); }

    await connection.execute(
      `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, review_text,
       service_quality_rating, punctuality_rating, communication_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [booking.id, req.user.id, booking.provider_id, Number(rating), review_text.trim(),
       service_quality_rating ? Number(service_quality_rating) : null,
       punctuality_rating ? Number(punctuality_rating) : null,
       communication_rating ? Number(communication_rating) : null]
    );

    const [aggregate] = await connection.execute(
      "SELECT AVG(rating) AS average_rating, COUNT(*) AS total_reviews FROM reviews WHERE provider_id = ? AND is_visible = TRUE",
      [booking.provider_id]
    );
    await connection.execute("UPDATE providers SET rating = ?, total_reviews = ? WHERE id = ?",
      [Number(aggregate[0].average_rating || 0).toFixed(2), aggregate[0].total_reviews, booking.provider_id]);
    await connection.commit();
    await notify(booking.provider_user_id, `A customer submitted a review for completed booking #${booking.id}.`, booking.id);
    return res.status(201).json({ message: "Review submitted successfully." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "This booking already has a review." });
    console.error("Create review:", error.message);
    return res.status(500).json({ message: "Could not submit review." });
  } finally { connection.release(); }
}

async function providerReviews(req, res) {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.review_text, r.service_quality_rating, r.punctuality_rating,
              r.communication_rating, r.created_at, u.name AS customer_name, r.booking_id
       FROM reviews r JOIN users u ON u.id = r.customer_id
       WHERE r.provider_id = ? AND r.is_visible = TRUE ORDER BY r.created_at DESC`,
      [req.params.providerId]
    );
    res.json({ reviews });
  } catch (error) {
    console.error("Provider reviews:", error.message);
    res.status(500).json({ message: "Could not load reviews." });
  }
}

async function myReviews(req, res) {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.booking_id, r.rating, r.review_text, r.created_at, p.business_name
       FROM reviews r JOIN providers p ON p.id = r.provider_id
       WHERE r.customer_id = ? ORDER BY r.created_at DESC`, [req.user.id]);
    res.json({ reviews });
  } catch (error) {
    console.error("My reviews:", error.message);
    res.status(500).json({ message: "Could not load your reviews." });
  }
}

module.exports = { createReview, providerReviews, myReviews };
