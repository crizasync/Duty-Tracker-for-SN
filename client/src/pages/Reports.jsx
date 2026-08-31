import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, FileText, PieChart, X } from "lucide-react";
import MenuBar from "../components/MenuBar";
import {
  downloadDutyReport,
  downloadProcedureReport,
  downloadReflectionReport,
  downloadSummaryReport,
} from "../services/reports";

const reportCards = [
  {
    key: "duties",
    title: "Duty Log Report",
    description: "Download a PDF summary of all duty logs.",
    icon: FileText,
    action: downloadDutyReport,
  },
  {
    key: "procedures",
    title: "Procedure Report",
    description: "Export all logged procedures into a PDF.",
    icon: PieChart,
    action: downloadProcedureReport,
  },
  {
    key: "reflections",
    title: "Reflection Report",
    description: "Download a journal-style reflection report.",
    icon: FileText,
    action: downloadReflectionReport,
  },
  {
    key: "summary",
    title: "Clinical Summary",
    description: "Generate a combined summary report.",
    icon: PieChart,
    action: downloadSummaryReport,
  },
];

export default function Reports() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openModal = (report) => {
    setSelectedReport(report);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedReport(null);
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      await selectedReport.action();
      toast.success(`${selectedReport.title} downloaded`);
      closeModal();
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />

        <section className="overflow-hidden rounded-3xl border border-pink-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                Reports Center
              </p>
              <h1 className="mt-1 text-3xl font-black text-rose-900">
                Generate and download PDFs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-rose-700">
                Export duty logs, procedures, reflections, or a clinical
                summary.
              </p>
            </div>
            <div className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-700">
              All reports are delivered as PDF downloads.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <article
                key={report.key}
                className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-pink-50 p-3 text-pink-700">
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                    PDF
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-rose-900">
                  {report.title}
                </h2>
                <p className="mt-2 text-sm text-rose-700">
                  {report.description}
                </p>

                <button
                  type="button"
                  onClick={() => openModal(report)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  <Download size={16} />
                  Generate
                </button>
              </article>
            );
          })}
        </section>
      </div>

      {isOpen && selectedReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-rose-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-pink-200 bg-white p-6 shadow-2xl md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-rose-900">
                  Generate {selectedReport.title}
                </h2>
                <p className="text-sm text-rose-700">
                  This will download the PDF report to your device.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-sm font-semibold text-rose-900">
                {selectedReport.description}
              </p>
              <p className="mt-2 text-sm text-rose-700">
                Confirm below to generate the PDF.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
