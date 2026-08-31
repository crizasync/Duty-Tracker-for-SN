const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getDashboard,
  getMonthlyHours,
} = require("../controllers/dashboardController");

router.get("/", auth, getDashboard);
router.get("/monthly-hours", auth, getMonthlyHours);



module.exports = router;