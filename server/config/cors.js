const normalizeOrigin = value => {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.origin : null;
  } catch { return null; }
};

exports.corsOptions = (clientUrls = "") => {
  const allowed = new Set(["http://localhost:5173", ...clientUrls.split(",").map(normalizeOrigin).filter(Boolean)]);
  return {
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  };
};
