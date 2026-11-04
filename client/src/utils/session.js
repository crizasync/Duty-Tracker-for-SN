export const sessionExpiredEvent = "duty-tracker:session-expired";

export function expireRejectedSession(error, storage, notify) {
  if (error.response?.status !== 401) return false;
  const token = storage.getItem("token");
  // Ignore unauthenticated failures and requests from a previous account/session.
  if (!token || error.config?.headers?.Authorization !== `Bearer ${token}`) return false;
  storage.removeItem("token");
  storage.removeItem("user");
  notify();
  return true;
}
