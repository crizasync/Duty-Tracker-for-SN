export function getAvatarUrl(avatar, apiBase = import.meta.env?.VITE_API_URL || globalThis.location?.origin || "http://localhost") {
  if (!avatar) return "";
  try {
    const origin = new URL(apiBase, globalThis.location?.origin || "http://localhost").origin;
    const url = new URL(avatar.startsWith("/") || /^https?:\/\//i.test(avatar) ? avatar : `/${avatar}`, origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
