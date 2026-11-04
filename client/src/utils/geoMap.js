export function validCoordinates(latitude, longitude) {
  return [latitude, longitude].every((value) => (typeof value === "number" || typeof value === "string") && String(value).trim() !== "" && Number.isFinite(Number(value))) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
}

export function locationFromLog(log) {
  if (!validCoordinates(log.facility_latitude, log.facility_longitude)) return null;
  return { latitude: Number(log.facility_latitude), longitude: Number(log.facility_longitude), address: log.facility_address || "", placeId: log.facility_place_id || "" };
}

export function groupFacilities(logs) {
  const facilities = new Map();
  const unmapped = [];
  for (const log of logs) {
    const location = locationFromLog(log);
    if (!location) { unmapped.push(log); continue; }
    const key = location.placeId || `${String(log.hospital || "").trim().toLowerCase()}:${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
    if (!facilities.has(key)) facilities.set(key, { key, name: log.hospital || "Facility", ...location, totalHours: 0, logs: [] });
    const facility = facilities.get(key);
    const hours = Number(log.total_hours);
    facility.totalHours += Number.isFinite(hours) ? hours : 0;
    facility.logs.push(log);
  }
  return { facilities: [...facilities.values()].sort((a, b) => b.totalHours - a.totalHours), unmapped };
}

export function calculateHours(timeIn, timeOut) {
  const parse = (value) => {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value || "")) throw new Error("Enter valid start and end times.");
    const [hour, minute, second = 0] = value.split(":").map(Number);
    return hour * 60 + minute + second / 60;
  };
  return Number((((parse(timeOut) - parse(timeIn) + 1440) % 1440) / 60).toFixed(2));
}

export function newDutyEntryId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // getRandomValues also works when a phone opens a local HTTP development server.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
