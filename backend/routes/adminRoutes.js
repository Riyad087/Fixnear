const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
  dashboard, listUsers, listProviders, listBookings, listApplications,
  decideApplication, listAuditLogs, listReviews, moderateReview
} = require("../controllers/adminController");
const { adminComplaints, updateComplaint } = require("../controllers/complaintController");
const router = express.Router();
router.use(requireAuth, requireRole("admin"));
router.get("/dashboard", dashboard);
router.get("/users", listUsers);
router.get("/providers", listProviders);
router.get("/bookings", listBookings);
router.get("/verifications", listApplications);
router.patch("/verifications/:id/approve", (req,res) => { req.params.decision = "approve"; return decideApplication(req,res); });
router.patch("/verifications/:id/reject", (req,res) => { req.params.decision = "reject"; return decideApplication(req,res); });
router.get("/complaints", adminComplaints);
router.patch("/complaints/:id/status", updateComplaint);
router.patch("/reviews/:id/hide", (req,res) => { req.params.action = "hide"; return moderateReview(req,res); });
router.patch("/reviews/:id/restore", (req,res) => { req.params.action = "restore"; return moderateReview(req,res); });
router.get("/audit-logs", listAuditLogs);
router.get("/reviews", listReviews);
module.exports = router;
