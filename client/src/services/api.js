import axios from "axios";
import { createOfflineCache } from "../utils/offlineCache";
import { resolveApiBase } from "../utils/apiBase";
import { expireRejectedSession, sessionExpiredEvent } from "../utils/session";

const cache = createOfflineCache(localStorage);
const accountId = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null")?.id; } catch { return null; }
};

const api = axios.create({
  baseURL: resolveApiBase(import.meta.env.VITE_API_URL),
  timeout: 10000,
});

// Automatically attach JWT
api.interceptors.request.use((config) => {
  config.offlineAccountId = accountId();
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!navigator.onLine) {
    config.adapter = async (request) => {
      const saved = cache.read(request, request.offlineAccountId);
      if (saved) return { data: { ...saved.data, offline: true }, status: 200, statusText: "Offline cache", headers: {}, config: request };
      throw new axios.AxiosError("Connect to the internet to use this feature or load these records for the first time.", "ERR_NETWORK", request);
    };
  }

  return config;
});

api.interceptors.response.use((response) => {
  if (!response.data?.offline && response.config.offlineAccountId === accountId()) {
    cache.save(response.config, response.config.offlineAccountId, response.data);
  }
  return response;
}, (error) => {
  expireRejectedSession(error, localStorage, () => window.dispatchEvent(new Event(sessionExpiredEvent)));
  if (!error.response && error.config?.offlineAccountId === accountId()) {
    const saved = cache.read(error.config, accountId());
    if (saved) return { data: { ...saved.data, offline: true }, status: 200, statusText: "Offline cache", headers: {}, config: error.config };
  }
  return Promise.reject(error);
});

export default api;
