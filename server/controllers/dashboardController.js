const pool = require("../config/db");

// MAIN DASHBOARD SUMMARY
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // TOTAL DUTY LOGS
    const dutyLogs = await pool.query(
      "SELECT COUNT(*) FROM duty_logs WHERE user_id = $1",
      [userId]
    );

    // TOTAL PROCEDURES
    const procedures = await pool.query(
      "SELECT COUNT(*) FROM procedures WHERE user_id = $1",
      [userId]
    );

    // TOTAL REFLECTIONS
    const reflections = await pool.query(
      "SELECT COUNT(*) FROM reflections WHERE user_id = $1",
      [userId]
    );

    // TOTAL HOURS
    const hoursResult = await pool.query(
      "SELECT SUM(total_hours) FROM duty_logs WHERE user_id = $1",
      [userId]
    );

    const totalHours = parseFloat(hoursResult.rows[0].sum || 0);

    res.json({
      success: true,
      dashboard: {
        totalDutyLogs: parseInt(dutyLogs.rows[0].count),
        totalProcedures: parseInt(procedures.rows[0].count),
        totalReflections: parseInt(reflections.rows[0].count),
        totalHours,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// MONTHLY HOURS (FOR CHARTS)
exports.getMonthlyHours = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(duty_date, 'YYYY-MM') AS month,
        SUM(total_hours) AS hours
      FROM duty_logs
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month ASC
      `,
      [userId]
    );

    res.json({
      success: true,
      monthlyHours: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};
