import api from "./api";

export const getProcedures = (params = {}) => api.get("/procedures", { params });

export const createProcedure = (data) => api.post("/procedures", data);

export const updateProcedure = (id, data) => api.put(`/procedures/${id}`, data);

export const deleteProcedure = (id) => api.delete(`/procedures/${id}`);
