const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { loginIpLimit, loginAccountLimit, registrationLimit } = require("../middleware/rateLimits");

router.post("/register", registrationLimit, register);
router.post("/login", loginIpLimit, loginAccountLimit, login);

module.exports = router;
