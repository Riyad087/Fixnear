const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { apply, myApplication } = require("../controllers/verificationController");
const router = express.Router();
router.use(requireAuth, requireRole("provider"));
router.post("/apply", apply);
router.get("/my", myApplication);
module.exports = router;
