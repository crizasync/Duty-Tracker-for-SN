const pool = require("../config/db");
const PDFDocument = require("pdfkit");

// 📄 DUTY LOG REPORT (PDF)
exports.generateDutyReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM duty_logs
       WHERE user_id = $1
       ORDER BY duty_date DESC`,
      [userId]
    );

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=duty-report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("NurseTrack - Duty Log Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((log, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${log.duty_date} | ${log.hospital} | ${log.ward} | ${log.shift} | Hours: ${log.total_hours}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error(error);
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
       WHERE user_id = $1`,
      [userId]
    );

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=procedure-report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("Procedure Summary Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((p, i) => {
      doc.text(
        `${i + 1}. ${p.procedure_name} | ${p.status} | Frequency: ${p.frequency}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error(error);
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
       ORDER BY duty_date DESC`,
      [userId]
    );

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reflection-report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("Reflection Journal Report", {
      align: "center",
    });

    doc.moveDown();

    result.rows.forEach((r, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${r.duty_date} - ${r.title}`
      );

      doc.text(r.content);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error(error);
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

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=summary-report.pdf"
    );

    doc.pipe(res);

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
    res.status(500).json({ success: false });
  }
};


