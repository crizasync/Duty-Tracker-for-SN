const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  createDutyLog,
  getDutyLogs,
  updateDutyLog,
  deleteDutyLog,
} = require("../controllers/dutyLogController");

router.post("/", auth, createDutyLog);
router.get("/", auth, getDutyLogs);
router.put("/:id", auth, updateDutyLog);
router.delete("/:id", auth, deleteDutyLog);

module.exports = router;