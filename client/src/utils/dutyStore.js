import { calculateHours } from "./geoMap.js";

export function createDutyStore({ storage, userId, send, online = () => true, uuid }) {
  const queueKey = `duty-tracker:duty-queue:${userId}`;
  const cacheKey = `duty-tracker:duty-cache:${userId}`;
  const read = (key) => { try { const value = JSON.parse(storage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = (key, value) => storage.setItem(key, JSON.stringify(value));
  const pendingLogs = () => read(queueKey).map(({ id, data }) => ({ id: `pending:${id}`, client_entry_id: id, user_id: userId, duty_date: data.dutyDate, hospital: data.hospital, ward: data.ward, shift: data.shift, time_in: data.timeIn, time_out: data.timeOut, total_hours: calculateHours(data.timeIn, data.timeOut), remarks: data.remarks, facility_latitude: data.facilityLocation?.latitude ?? null, facility_longitude: data.facilityLocation?.longitude ?? null, facility_address: data.facilityLocation?.address || "", facility_place_id: data.facilityLocation?.placeId || "", pending: true }));
  const merge = (logs) => {
    const ids = new Set(logs.map((log) => log.client_entry_id).filter(Boolean));
    return [...pendingLogs().filter((log) => !ids.has(log.client_entry_id)), ...logs];
  };
  const remember = (logs) => { try { write(cacheKey, logs); } catch { /* Saving online records never depends on cache storage. */ } };
  const remove = (id) => write(queueKey, read(queueKey).filter((entry) => entry.id !== id));
  const cacheSaved = (log) => remember([log, ...read(cacheKey).filter((entry) => entry.id !== log.id)]);
  let syncing = null;
  return {
    merge, remember, cached: () => merge(read(cacheKey)), pending: pendingLogs,
    updateCached: cacheSaved,
    deleteCached: (id) => remember(read(cacheKey).filter((log) => log.id !== id)),
    discard: (id) => remove(String(id).replace(/^pending:/, "")),
    async create(data) {
      if (!data.hospital?.trim() || !data.dutyDate || !data.ward?.trim()) throw new Error("Complete the duty date, hospital, and ward.");
      calculateHours(data.timeIn, data.timeOut);
      const id = uuid();
      const queued = { id, data: { ...data, clientEntryId: id } };
      // Persist before sending: retries use the same id and cannot duplicate a shift.
      try {
        write(queueKey, [...read(queueKey), queued]);
      } catch {
        if (online()) return send(queued.data);
        throw new Error("Device storage is unavailable. Please reconnect to save this shift.");
      }
      if (online()) {
        try {
          const response = await send(queued.data);
          cacheSaved(response.data.dutyLog);
          remove(id);
          return { ...response, data: { ...response.data, pending: false } };
        } catch (error) {
          if (error.response?.status >= 400 && error.response.status < 500) { remove(id); throw error; }
        }
      }
      return { data: { pending: true, dutyLog: pendingLogs().find((log) => log.client_entry_id === id) } };
    },
    sync() {
      if (syncing) return syncing;
      syncing = (async () => {
        let count = 0;
        for (const entry of read(queueKey)) {
          if (!online()) break;
          try {
            const response = await send(entry.data);
            cacheSaved(response.data.dutyLog);
            remove(entry.id);
            count++;
          } catch { break; } // Keep unsynced entries intact, including validation failures.
        }
        return count;
      })().finally(() => { syncing = null; });
      return syncing;
    },
  };
}
