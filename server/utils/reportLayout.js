const { pdfText } = require("./securePdf");
const ink = "#1e293b", muted = "#64748b", accent = "#365b43", rule = "#e2e8f0";
const text = value => pdfText(value, 500) || "—";
const date = value => {
  if (!value) return "—";
  // PostgreSQL DATE strings stay calendar dates, independent of server timezone.
  const match = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parsed = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

exports.reportDate = date;
exports.beginReport = (doc, title, profile, stats, now = new Date()) => {
  const width = doc.page.width - 84;
  doc.info.Title = `Duty-Tracker | ${title}`;
  doc.info.Author = "Duty-Tracker";
  const pageHeader = () => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(accent).text("DUTY-TRACKER", 42, 30, { width });
    doc.font("Helvetica").fontSize(8).fillColor(muted).text(title, 42, 32, { width, align: "right" });
    doc.moveTo(42, 54).lineTo(doc.page.width - 42, 54).strokeColor(rule).lineWidth(0.7).stroke();
    doc.font("Helvetica").fontSize(10).fillColor(ink);
    doc.x = 42; doc.y = 76;
  };
  pageHeader();
  doc.on("pageAdded", pageHeader);
  doc.font("Helvetica-Bold").fontSize(23).fillColor(ink).text(title, 42, 83, { width });
  doc.font("Helvetica").fontSize(10).fillColor(muted).text("Clinical activity record · All recorded dates", 42, doc.y + 7, { width });
  doc.moveDown(1.3);
  doc.fillColor(ink).font("Helvetica-Bold").text(text(profile.full_name || profile.username || "Account holder"), { width });
  doc.font("Helvetica").fontSize(9).fillColor(muted).text(`Username: ${text(profile.username)}   |   Generated: ${date(now)} (UTC)`, { width });
  doc.moveDown(1.5);
  const top = doc.y;
  const cardWidth = width / stats.length;
  stats.forEach(([label, value], i) => {
    const x = 42 + i * cardWidth;
    doc.rect(x, top, cardWidth, 58).fill("#f1f5f3");
    doc.font("Helvetica").fontSize(8).fillColor(muted).text(label.toUpperCase(), x + 12, top + 10, { width: cardWidth - 24 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(accent).text(String(value), x + 12, top + 26, { width: cardWidth - 24 });
  });
  doc.x = 42; doc.y = top + 80;
};

exports.sectionTitle = (doc, title) => {
  if (doc.y + 45 > doc.page.height - 60) doc.addPage();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(ink).text(title, 42, doc.y);
  doc.moveDown(0.7);
};

exports.reportTable = (doc, columns, rows) => {
  const width = doc.page.width - 84;
  const widths = columns.map(column => column.share * width);
  const header = () => {
    if (doc.y + 50 > doc.page.height - 60) doc.addPage();
    const top = doc.y;
    doc.rect(42, top, width, 27).fill(accent);
    let x = 42;
    columns.forEach((column, i) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("white").text(column.label, x + 8, top + 9, { width: widths[i] - 16, lineBreak: false });
      x += widths[i];
    });
    doc.y = top + 27;
  };
  header();
  if (!rows.length) {
    doc.font("Helvetica").fontSize(10).fillColor(muted).text("No records available for this report.", 50, doc.y + 15, { width: width - 16 });
    doc.moveDown();
    return;
  }
  rows.forEach((row, index) => {
    doc.font("Helvetica").fontSize(9);
    const cells = row.map(text);
    const height = Math.max(34, ...cells.map((cell, i) => Math.min(140, doc.heightOfString(cell, { width: widths[i] - 16 })) + 18));
    if (doc.y + height > doc.page.height - 60) { doc.addPage(); header(); }
    const top = doc.y;
    if (index % 2 === 0) doc.rect(42, top, width, height).fill("#f8fafc");
    let x = 42;
    cells.forEach((cell, i) => {
      doc.font("Helvetica").fontSize(9).fillColor(ink).text(cell, x + 8, top + 9, { width: widths[i] - 16, height: height - 16, ellipsis: true, align: columns[i].align || "left" });
      x += widths[i];
    });
    doc.moveTo(42, top + height).lineTo(42 + width, top + height).strokeColor(rule).lineWidth(0.4).stroke();
    doc.x = 42; doc.y = top + height;
  });
  doc.y += 18;
};

exports.reflectionEntry = (doc, entry, index) => {
  if (doc.y + 100 > doc.page.height - 60) doc.addPage();
  doc.font("Helvetica").fontSize(8).fillColor(accent).text(`ENTRY ${String(index + 1).padStart(2, "0")}  /  ${date(entry.duty_date)}`, 42, doc.y);
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(ink).text(text(entry.title), { width: doc.page.width - 84 });
  doc.moveDown(0.6);
  doc.font("Helvetica").fontSize(10).fillColor(ink).text(pdfText(entry.content) || "No reflection content recorded.", { width: doc.page.width - 84, lineGap: 4 });
  doc.moveDown(1.2);
  doc.moveTo(42, doc.y).lineTo(doc.page.width - 42, doc.y).strokeColor(rule).stroke();
  doc.moveDown(1.4);
};

exports.finishReport = doc => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 39;
    doc.moveTo(42, y - 10).lineTo(doc.page.width - 42, y - 10).strokeColor(rule).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(muted).text("Duty-Tracker · Personal clinical record", 42, y, { lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, 42, y, { width: doc.page.width - 84, align: "right", lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
  doc.end();
};
