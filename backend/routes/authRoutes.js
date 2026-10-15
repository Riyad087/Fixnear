const express = require("express");
const { register, registerProvider, login } = require("../controllers/authController");

const router = express.Router();
router.post("/register", register); // Public registration always creates a customer.
router.post("/register-provider", registerProvider); // Provider role only; never accepts an admin role.
router.post("/login", login);
module.exports = router;
