const { test } = require("node:test");
const assert = require("node:assert/strict");
const PDFDocument = require("pdfkit");
const { beginReport, reportTable, reflectionEntry, finishReport, reportDate } = require("./reportLayout");

function document() {
  const doc = new PDFDocument({ size: "A4", margins: { top: 76, bottom: 60, left: 42, right: 42 }, bufferPages: true, compress: false });
  const chunks = [];
  doc.on("data", chunk => chunks.push(chunk));
  const output = new Promise((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  return { doc, output };
}

test("tables paginate, repeat headings, and number pages without adding footer-only pages", async () => {
  const { doc, output } = document();
  beginReport(doc, "Duty Log Report", { full_name: "Sample Clinician", username: "sample" }, [["Shifts recorded", 100]], new Date("2026-11-04T00:00:00Z"));
  const headerPages = new Set();
  const renderText = doc.text;
  doc.text = function (value, ...args) {
    if (value === "FACILITY") headerPages.add(this.page);
    return renderText.call(this, value, ...args);
  };
  reportTable(doc, [{ label: "DATE", share: .25 }, { label: "FACILITY", share: .75 }], Array.from({ length: 100 }, (_, i) => ["04 Nov 2026", `Hospital ${i + 1} / Emergency Department`]));
  const before = doc.bufferedPageRange().count;
  assert.ok(before > 1);
  assert.ok(doc.y < doc.page.height - 40);
  finishReport(doc);
  const pdf = (await output).toString("latin1");
  assert.equal((pdf.match(/\/Type \/Page\b/g) || []).length, before);
  assert.equal(headerPages.size, before);
});

test("long reflection entries flow across pages and empty tables generate valid PDFs", async () => {
  const { doc, output } = document();
  beginReport(doc, "Reflection Journal", { username: "sample" }, [["Journal entries", 1]]);
  reflectionEntry(doc, { title: "Learning during a clinical shift", duty_date: "2026-11-04", content: "A detailed clinical reflection with observations and lessons learned. ".repeat(170) }, 0);
  assert.ok(doc.bufferedPageRange().count > 1);
  finishReport(doc);
  assert.equal((await output).subarray(0, 5).toString(), "%PDF-");
  const empty = document();
  beginReport(empty.doc, "Duty Log Report", {}, [["Shifts recorded", 0]]);
  reportTable(empty.doc, [{ label: "DATE", share: 1 }], []);
  finishReport(empty.doc);
  assert.ok((await empty.output).length > 1000);
});

test("report dates preserve calendar days and handle empty or invalid dates", () => {
  assert.equal(reportDate("2026-11-04"), "04 Nov 2026");
  assert.equal(reportDate(null), "—");
  assert.equal(reportDate("invalid"), "—");
});
