export const sessionExpiredEvent = "duty-tracker:session-expired";

export const isMobileSession = browser => browser.matchMedia("(max-width: 1023px)").matches;

export function clearSession(storage) {
  storage.removeItem("token");
  storage.removeItem("user");
}

export function installMobileSessionLock({ browser, document, storage, onLock, idleMs = 15 * 60 * 1000, now = Date.now }) {
  let lastActivity = now();
  let timer;
  const lock = () => {
    if (!isMobileSession(browser)) return;
    clearSession(storage);
    onLock();
  };
  const schedule = () => {
    browser.clearTimeout(timer);
    timer = browser.setTimeout(lock, idleMs);
  };
  const activity = () => {
    if (now() - lastActivity >= idleMs) lock();
    lastActivity = now();
    schedule();
  };
  const visibility = () => {
    if (document.visibilityState === "hidden") lock();
    else activity();
  };
  const restored = event => {
    if (event.persisted) lock();
    else activity();
  };
  const events = ["pointerdown", "keydown", "touchstart", "scroll"];
  events.forEach(event => document.addEventListener(event, activity, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", visibility);
  browser.addEventListener("pagehide", lock);
  browser.addEventListener("pageshow", restored);
  schedule();
  return () => {
    browser.clearTimeout(timer);
    events.forEach(event => document.removeEventListener(event, activity, true));
    document.removeEventListener("visibilitychange", visibility);
    browser.removeEventListener("pagehide", lock);
    browser.removeEventListener("pageshow", restored);
  };
}

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
