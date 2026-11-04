import api from "./api";
import { createDutyStore } from "../utils/dutyStore";
import { newDutyEntryId } from "../utils/geoMap";

export const dutyRecordsEvent = "duty-tracker:records-changed";
const stores = new Map();
const sessionId = () => JSON.parse(localStorage.getItem("user") || "null")?.id;
const store = () => {
  const id = sessionId();
  if (!id) throw new Error("Sign in to manage duty records.");
  if (!stores.has(id)) stores.set(id, createDutyStore({ storage: localStorage, userId: id, send: (data) => {
    if (sessionId() !== id) throw new Error("The signed-in account changed.");
    return api.post("/duty-logs", data, { timeout: 10000 });
  }, online: () => navigator.onLine, uuid: newDutyEntryId }));
  return stores.get(id);
};
const changed = () => window.dispatchEvent(new Event(dutyRecordsEvent));
const filterLogs = (logs, params) => logs.filter((log) => (!params.startDate || String(log.duty_date).slice(0, 10) >= params.startDate) && (!params.endDate || String(log.duty_date).slice(0, 10) <= params.endDate) && (!params.shift || log.shift === params.shift));

export const getDutyLogs = async (params = {}) => {
  const records = store();
  if (!navigator.onLine) return { data: { dutyLogs: filterLogs(records.cached(), params), offline: true } };
  try {
    const response = await api.get("/duty-logs", { params, timeout: 10000 });
    const logs = response.data.dutyLogs || [];
    if (!Object.values(params).some(Boolean)) records.remember(logs);
    return { ...response, data: { ...response.data, dutyLogs: filterLogs(records.merge(logs), params) } };
  } catch (error) {
    if (error.response) throw error;
    return { data: { dutyLogs: filterLogs(records.cached(), params), offline: true } };
  }
};

export const createDutyLog = async (data) => {
  const result = await store().create(data);
  changed();
  return result;
};

export const syncDutyLogs = async () => {
  if (!sessionId() || !navigator.onLine) return 0;
  const count = await store().sync();
  if (count) changed();
  return count;
};

export const updateDutyLog = async (id, data) => {
  const records = store();
  const response = await api.put(`/duty-logs/${id}`, data);
  records.updateCached(response.data.dutyLog);
  changed();
  return response;
};

export const deleteDutyLog = async (id) => {
  const records = store();
  if (String(id).startsWith("pending:")) records.discard(id);
  else { await api.delete(`/duty-logs/${id}`); records.deleteCached(id); }
  changed();
};
