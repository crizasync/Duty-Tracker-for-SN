const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  generateDutyReport,
  generateProcedureReport,
  generateReflectionReport,
  generateSummaryReport,
} = require("../controllers/reportController");

router.get("/duties", auth, generateDutyReport);
router.get("/procedures", auth, generateProcedureReport);
router.get("/reflections", auth, generateReflectionReport);
router.get("/summary", auth, generateSummaryReport);

module.exports = router;