import api from "./api";

export const getReflections = (params = {}) => api.get("/reflections", { params });

export const createReflection = (data) => api.post("/reflections", data);

export const updateReflection = (id, data) => api.put(`/reflections/${id}`, data);

export const deleteReflection = (id) => api.delete(`/reflections/${id}`);
