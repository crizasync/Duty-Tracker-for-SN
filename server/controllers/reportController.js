const pool = require("../config/db");
const { startPdf, pdfText } = require("../utils/securePdf");

// 📄 DUTY LOG REPORT (PDF)
exports.generateDutyReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM duty_logs
       WHERE user_id = $1
       ORDER BY duty_date DESC LIMIT 1001`,
      [userId]
    );

    const doc = startPdf(res, "duty-report.pdf", result.rows.length);
    if (!doc) return;

    doc.fontSize(18).text("Duty-Tracker - Duty Log Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((log, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${pdfText(log.duty_date, 500)} | ${pdfText(log.hospital, 500)} | ${pdfText(log.ward, 500)} | ${pdfText(log.shift, 500)} | Hours: ${pdfText(log.total_hours, 500)}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ success: false });
  }
};

// PROCEDURE REPORT
exports.generateProcedureReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT procedure_name, status, frequency
       FROM procedures
       WHERE user_id = $1 LIMIT 1001`,
      [userId]
    );

    const doc = startPdf(res, "procedure-report.pdf", result.rows.length);
    if (!doc) return;

    doc.fontSize(18).text("Procedure Summary Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((p, i) => {
      doc.text(
        `${i + 1}. ${pdfText(p.procedure_name, 500)} | ${pdfText(p.status, 500)} | Frequency: ${pdfText(p.frequency, 500)}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ success: false });
  }
};

// REFLECTION REPORT
exports.generateReflectionReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT title, duty_date, content
       FROM reflections
       WHERE user_id = $1
       ORDER BY duty_date DESC LIMIT 1001`,
      [userId]
    );

    const doc = startPdf(res, "reflection-report.pdf", result.rows.length);
    if (!doc) return;

    doc.fontSize(18).text("Reflection Journal Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((r, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${pdfText(r.duty_date, 500)} - ${pdfText(r.title, 500)}`
      );

      doc.text(pdfText(r.content));
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error(error);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ success: false });
  }
};

// SUMMARY REPORT
exports.generateSummaryReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const hours = await pool.query(
      "SELECT SUM(total_hours) FROM duty_logs WHERE user_id = $1",
      [userId]
    );

    const duties = await pool.query(
      "SELECT COUNT(*) FROM duty_logs WHERE user_id = $1",
      [userId]
    );

    const doc = startPdf(res, "summary-report.pdf", 0);
    if (!doc) return;

    doc.fontSize(18).text("Clinical Summary Report", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12).text(
      `Total Clinical Hours: ${hours.rows[0].sum || 0}`
    );

    doc.text(
      `Total Duty Logs: ${duties.rows[0].count}`
    );

    doc.end();
  } catch (error) {
    console.error(error);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ success: false });
  }
};


