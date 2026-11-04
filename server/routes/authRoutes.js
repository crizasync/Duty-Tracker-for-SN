const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { loginIpLimit, loginAccountLimit } = require("../middleware/rateLimits");

router.post("/register", register);
router.post("/login", loginIpLimit, loginAccountLimit, login);

module.exports = router;
