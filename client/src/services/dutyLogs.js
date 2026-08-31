import api from "./api";

export const getDutyLogs = (params = {}) => api.get("/duty-logs", { params });

export const createDutyLog = (data) => api.post("/duty-logs", data);

export const updateDutyLog = (id, data) => api.put(`/duty-logs/${id}`, data);

export const deleteDutyLog = (id) => api.delete(`/duty-logs/${id}`);
