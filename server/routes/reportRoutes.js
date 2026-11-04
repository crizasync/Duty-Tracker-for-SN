const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { reportLimit } = require("../middleware/rateLimits");
router.use(auth, reportLimit);

const {
  generateDutyReport,
  generateProcedureReport,
  generateReflectionReport,
  generateSummaryReport,
} = require("../controllers/reportController");

router.get("/duties", generateDutyReport);
router.get("/procedures", generateProcedureReport);
router.get("/reflections", generateReflectionReport);
router.get("/summary", generateSummaryReport);

module.exports = router;
