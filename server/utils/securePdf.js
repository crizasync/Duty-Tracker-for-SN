const PDFDocument = require("pdfkit");

exports.pdfText = (value, maxLength = 12000) => String(value ?? "")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
  .slice(0, maxLength);

exports.startPdf = (res, filename, rowCount = 0) => {
  if (rowCount > 1000) {
    res.status(413).json({ success: false, message: "This report exceeds the 1,000-record download limit." });
    return null;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  const doc = new PDFDocument({ pdfVersion: "1.7", autoFirstPage: true });
  doc.on("error", () => res.destroy());
  res.on("close", () => { if (!doc.destroyed) doc.destroy(); });
  doc.pipe(res);
  return doc;
};
