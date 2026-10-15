const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { createBooking, getMyBookings, getProviderBookings, getBookingDetails, changeBookingState } = require("../controllers/bookingController");
const router = express.Router();

router.use(requireAuth);
router.post("/", (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can create bookings." });
  return createBooking(req, res);
});
router.get("/my", (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Customer account required." });
  return getMyBookings(req, res);
});
router.get("/provider", (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ message: "Provider account required." });
  return getProviderBookings(req, res);
});
router.get("/:id", getBookingDetails);
router.patch("/:id/accept", (req, res) => { req.params.action = "accept"; return changeBookingState(req, res); });
router.patch("/:id/reject", (req, res) => { req.params.action = "reject"; return changeBookingState(req, res); });
router.patch("/:id/status", (req, res) => { req.params.action = "status"; return changeBookingState(req, res); });
router.patch("/:id/cancel", (req, res) => { req.params.action = "cancel"; return changeBookingState(req, res); });

module.exports = router;
