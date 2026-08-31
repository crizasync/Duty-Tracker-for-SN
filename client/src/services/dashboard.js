import api from "./api";

export const getDashboardSummary = () => api.get("/dashboard");

export const getMonthlyHours = () => api.get("/dashboard/monthly-hours");
