export function resolveApiBase(value) {
  const base = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  if (!base) return "/api";
  // A backend origin alone still needs the Express API mount path.
  if (/^https?:\/\/[^/]+$/i.test(base)) return `${base}/api`;
  return base;
}
