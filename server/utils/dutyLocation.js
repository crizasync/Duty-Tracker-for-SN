function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function normalizeLocation(location) {
  if (location == null) return [null, null, null, null];
  const { latitude, longitude, address, placeId } = location;
  if (![latitude, longitude].every((value) => (typeof value === "number" || typeof value === "string") && String(value).trim() && Number.isFinite(Number(value))) ||
      Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
    throw invalid("Choose a valid facility location, or remove the optional location.");
  }
  return [Number(latitude), Number(longitude), String(address || "").slice(0, 1000), String(placeId || "").slice(0, 100)];
}

function dutyHours(timeIn, timeOut) {
  const minutes = (time) => {
    if (typeof time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) throw invalid("Enter valid start and end times.");
    const [hours, mins, seconds = 0] = time.split(":").map(Number);
    return hours * 60 + mins + seconds / 60;
  };
  return Number((((minutes(timeOut) - minutes(timeIn) + 1440) % 1440) / 60).toFixed(2));
}

module.exports = { normalizeLocation, dutyHours, invalid };
