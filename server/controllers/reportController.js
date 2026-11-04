const pool = require("../config/db");
const { startPdf } = require("../utils/securePdf");
const { beginReport, sectionTitle, reportTable, reflectionEntry, finishReport, reportDate } = require("../utils/reportLayout");

const hours = value => (Number(value) || 0).toFixed(2);
const definitions = {
  duty: { title: "Duty Log Report", sql: "SELECT * FROM duty_logs WHERE user_id = $1 ORDER BY duty_date DESC LIMIT 1001" },
  procedure: { title: "Procedure Report", sql: "SELECT procedure_name, status, frequency, date_performed FROM procedures WHERE user_id = $1 ORDER BY date_performed DESC LIMIT 1001" },
  reflection: { title: "Reflection Journal", sql: "SELECT title, duty_date, content FROM reflections WHERE user_id = $1 ORDER BY duty_date DESC LIMIT 1001" },
  summary: { title: "Clinical Summary", sql: `SELECT
    (SELECT COALESCE(SUM(total_hours), 0) FROM duty_logs WHERE user_id = $1) AS hours,
    (SELECT COUNT(*) FROM duty_logs WHERE user_id = $1) AS duties,
    (SELECT COUNT(*) FROM procedures WHERE user_id = $1) AS procedures,
    (SELECT COUNT(*) FROM procedures WHERE user_id = $1 AND LOWER(TRIM(status)) = 'completed') AS completed,
    (SELECT COUNT(*) FROM procedures WHERE user_id = $1 AND LOWER(TRIM(status)) = 'pending') AS pending,
    (SELECT COUNT(*) FROM reflections WHERE user_id = $1) AS reflections` },
};

const generate = kind => async (req, res) => {
  try {
    const definition = definitions[kind];
    const owner = await pool.query("SELECT full_name, username FROM users WHERE id = $1", [req.user.id]);
    const result = await pool.query(definition.sql, [req.user.id]);
    const rows = result.rows;
    const doc = startPdf(res, kind + "-report.pdf", kind === "summary" ? 0 : rows.length);
    if (!doc) return;
    const profile = owner.rows[0] || { username: req.user.username };
    if (kind === "duty") {
      const total = rows.reduce((sum, row) => sum + (Number(row.total_hours) || 0), 0);
      beginReport(doc, definition.title, profile, [["Shifts recorded", rows.length], ["Total hours", hours(total)], ["Average hours / shift", hours(rows.length ? total / rows.length : 0)]]);
      sectionTitle(doc, "Duty register");
      reportTable(doc, [
        { label: "DATE", share: .18 }, { label: "FACILITY / WARD", share: .38 },
        { label: "SHIFT", share: .18 }, { label: "HOURS", share: .12, align: "right" }, { label: "NO.", share: .14, align: "right" },
      ], rows.map((row, i) => [reportDate(row.duty_date), [row.hospital, row.ward].filter(Boolean).join(" / "), row.shift, hours(row.total_hours), i + 1]));
    } else if (kind === "procedure") {
      const completed = rows.filter(row => String(row.status).trim().toLowerCase() === "completed").length;
      const pending = rows.filter(row => String(row.status).trim().toLowerCase() === "pending").length;
      beginReport(doc, definition.title, profile, [["Procedures recorded", rows.length], ["Completed", completed], ["Pending", pending]]);
      sectionTitle(doc, "Procedure register");
      reportTable(doc, [
        { label: "DATE", share: .18 }, { label: "PROCEDURE", share: .42 },
        { label: "STATUS", share: .20 }, { label: "FREQUENCY", share: .20 },
      ], rows.map(row => [reportDate(row.date_performed), row.procedure_name, row.status, row.frequency]));
    } else if (kind === "reflection") {
      beginReport(doc, definition.title, profile, [["Journal entries", rows.length], ["Coverage", "All dates"]]);
      sectionTitle(doc, "Clinical reflections");
      if (!rows.length) doc.font("Helvetica").fontSize(10).text("No reflections available for this report.");
      rows.forEach((entry, i) => reflectionEntry(doc, entry, i));
    } else {
      const summary = rows[0] || {};
      beginReport(doc, definition.title, profile, [["Clinical hours", hours(summary.hours)], ["Shifts recorded", summary.duties || 0], ["Procedures", summary.procedures || 0]]);
      sectionTitle(doc, "Activity overview");
      reportTable(doc, [{ label: "MEASURE", share: .72 }, { label: "TOTAL", share: .28, align: "right" }], [
        ["Total clinical hours", hours(summary.hours)], ["Duty shifts recorded", summary.duties || 0],
        ["Procedures recorded", summary.procedures || 0], ["Completed procedures", summary.completed || 0],
        ["Pending procedures", summary.pending || 0], ["Reflection entries", summary.reflections || 0],
        ["Average hours per shift", hours(Number(summary.duties) ? Number(summary.hours) / Number(summary.duties) : 0)],
      ]);
      doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("This report summarizes records entered by the account holder. It does not certify attendance or competency.", 42, doc.y, { width: doc.page.width - 84, lineGap: 3 });
    }
    finishReport(doc);
  } catch (error) {
    console.error(error);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ success: false, message: "Unable to generate report" });
  }
};

exports.generateDutyReport = generate("duty");
exports.generateProcedureReport = generate("procedure");
exports.generateReflectionReport = generate("reflection");
exports.generateSummaryReport = generate("summary");
