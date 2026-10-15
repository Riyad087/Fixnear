const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { createQuote, listQuotes, respondQuote, decideQuote } = require("../controllers/quoteController");
const router = express.Router();
router.use(requireAuth);
router.post("/", (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can request quotes." });
  return createQuote(req, res);
});
router.get("/my", listQuotes);
router.get("/provider", (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ message: "Provider account required." });
  return listQuotes(req, res);
});
router.patch("/:id/respond", (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ message: "Provider account required." });
  return respondQuote(req, res);
});
router.patch("/:id/accept", (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Customer account required." });
  req.params.decision = "accept";
  return decideQuote(req, res);
});
router.patch("/:id/reject", (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Customer account required." });
  req.params.decision = "reject";
  return decideQuote(req, res);
});
module.exports = router;
