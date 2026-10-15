const { pool } = require("../config/db");
const { notify } = require("../models/module2Helpers");

async function createQuote(req, res) {
  const { provider_id, problem_description, city, area, service_address, budget_min, budget_max } = req.body;
  if (!provider_id || !problem_description || !city || !area || !service_address) {
    return res.status(400).json({ message: "Provider, problem, city, area, and address are required." });
  }
  if ((budget_min != null && Number(budget_min) < 0) || (budget_max != null && Number(budget_max) < 0) ||
      (budget_min != null && budget_max != null && Number(budget_min) > Number(budget_max))) {
    return res.status(400).json({ message: "Budget range is invalid." });
  }
  try {
    const [providers] = await pool.execute(
      "SELECT id, user_id FROM providers WHERE id = ? AND is_verified = TRUE AND is_available = TRUE",
      [Number(provider_id)]
    );
    if (!providers.length) return res.status(404).json({ message: "Verified, available provider not found." });
    const [result] = await pool.execute(
      `INSERT INTO quotes (customer_id, provider_id, problem_description, city, area, service_address, budget_min, budget_max)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, providers[0].id, problem_description.trim(), city.trim(), area.trim(), service_address.trim(),
       budget_min == null || budget_min === "" ? null : Number(budget_min),
       budget_max == null || budget_max === "" ? null : Number(budget_max)]
    );
    await notify(providers[0].user_id, `New quote request #${result.insertId}.`, null, result.insertId);
    res.status(201).json({ message: "Quote request submitted.", quote_id: result.insertId });
  } catch (error) {
    console.error("Create quote:", error.message);
    res.status(500).json({ message: "Could not create quote request." });
  }
}

async function listQuotes(req, res) {
  try {
    let rows;
    if (req.user.role === "provider") {
      const [providers] = await pool.execute("SELECT id FROM providers WHERE user_id = ?", [req.user.id]);
      if (!providers.length) return res.status(403).json({ message: "Provider profile required." });
      [rows] = await pool.execute(
        `SELECT q.*, u.name AS customer_name FROM quotes q JOIN users u ON u.id = q.customer_id
         WHERE q.provider_id = ? ORDER BY q.created_at DESC`, [providers[0].id]);
    } else {
      [rows] = await pool.execute(
        `SELECT q.*, p.business_name FROM quotes q JOIN providers p ON p.id = q.provider_id
         WHERE q.customer_id = ? ORDER BY q.created_at DESC`, [req.user.id]);
    }
    res.json({ quotes: rows });
  } catch (error) {
    console.error("List quotes:", error.message);
    res.status(500).json({ message: "Could not load quotes." });
  }
}

async function respondQuote(req, res) {
  const { estimated_price, estimated_duration, provider_message, valid_until } = req.body;
  if (estimated_price == null || !Number.isFinite(Number(estimated_price)) || Number(estimated_price) < 0) {
    return res.status(400).json({ message: "Enter a valid estimated price." });
  }
  try {
    const [providers] = await pool.execute("SELECT id FROM providers WHERE user_id = ?", [req.user.id]);
    if (!providers.length) return res.status(403).json({ message: "Provider profile required." });
    const [quotes] = await pool.execute("SELECT * FROM quotes WHERE id = ? AND provider_id = ?", [req.params.id, providers[0].id]);
    const quote = quotes[0];
    if (!quote) return res.status(404).json({ message: "Quote not found." });
    if (quote.status !== "requested") return res.status(409).json({ message: "Only requested quotes can be answered." });
    await pool.execute(
      `UPDATE quotes SET estimated_price = ?, estimated_duration = ?, provider_message = ?,
       valid_until = ?, status = 'quoted' WHERE id = ?`,
      [Number(estimated_price), estimated_duration || null, provider_message || null, valid_until || null, quote.id]
    );
    await notify(quote.customer_id, `Provider sent a response to quote #${quote.id}.`, null, quote.id);
    res.json({ message: "Quote response submitted." });
  } catch (error) {
    console.error("Respond quote:", error.message);
    res.status(500).json({ message: "Could not respond to quote." });
  }
}

async function decideQuote(req, res) {
  const { decision } = req.params;
  if (!["accept", "reject"].includes(decision)) return res.status(400).json({ message: "Invalid quote decision." });
  try {
    const [quotes] = await pool.execute("SELECT * FROM quotes WHERE id = ? AND customer_id = ?", [req.params.id, req.user.id]);
    const quote = quotes[0];
    if (!quote) return res.status(404).json({ message: "Quote not found." });
    if (quote.status !== "quoted") return res.status(409).json({ message: "Only quoted requests can be accepted or rejected." });
    const next = decision === "accept" ? "accepted" : "rejected";
    await pool.execute("UPDATE quotes SET status = ? WHERE id = ?", [next, quote.id]);
    const [providers] = await pool.execute("SELECT user_id FROM providers WHERE id = ?", [quote.provider_id]);
    if (providers.length) await notify(providers[0].user_id, `Quote #${quote.id} was ${next}.`, null, quote.id);
    res.json({ message: `Quote ${next}.`, status: next });
  } catch (error) {
    console.error("Decide quote:", error.message);
    res.status(500).json({ message: "Could not update quote." });
  }
}

module.exports = { createQuote, listQuotes, respondQuote, decideQuote };
