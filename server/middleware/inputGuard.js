// Values remain bound SQL parameters. Reject operator objects and ambiguous inputs;
// never strip SQL words or punctuation from legitimate notes and names.
module.exports = (req, res, next) => {
  const unsafe = (value, depth = 0) => {
    if (depth > 8) return true;
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, entry]) =>
      /(^|\[|\.)\$/.test(key) || ["__proto__", "prototype", "constructor"].includes(key) || unsafe(entry, depth + 1));
  };
  if (Array.isArray(req.body) || unsafe(req.body) || unsafe(req.query) || Object.values(req.query || {}).some(value => typeof value !== "string")) {
    return res.status(400).json({ success: false, message: "Invalid request fields or query filters" });
  }
  const scalarFields = ["username", "password", "fullName", "phoneNumber", "title", "content", "dutyDate", "hospital", "ward", "shift", "timeIn", "timeOut", "remarks", "clientEntryId", "procedureName", "status", "notes", "datePerformed"];
  for (const field of scalarFields) {
    const value = req.body?.[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return res.status(400).json({ success: false, message: `Invalid ${field}` });
    }
  }
  next();
};
