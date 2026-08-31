import api from "./api";

const downloadPdf = async (url, filename) => {
	const response = await api.get(url, { responseType: "blob" });
	const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
	const link = document.createElement("a");
	link.href = blobUrl;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(blobUrl);
};

export const downloadDutyReport = () => downloadPdf("/reports/duties", "duty-report.pdf");
export const downloadProcedureReport = () => downloadPdf("/reports/procedures", "procedure-report.pdf");
export const downloadReflectionReport = () => downloadPdf("/reports/reflections", "reflection-report.pdf");
export const downloadSummaryReport = () => downloadPdf("/reports/summary", "summary-report.pdf");
