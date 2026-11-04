import { useEffect, useState } from "react";
import { Download, RefreshCw, WifiOff } from "lucide-react";

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [ready, setReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    let registration;
    let installing;
    let active = true;
    const checkUpdate = () => {
      if (navigator.onLine) registration?.update().catch(() => {});
    };
    const connection = () => { setOnline(navigator.onLine); checkUpdate(); };
    const visible = () => { if (document.visibilityState === "visible") checkUpdate(); };
    const installedUpdate = () => {
      if (active && installing?.state === "installed" && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
      }
    };
    const updateFound = () => {
      installing = registration.installing;
      installing?.addEventListener("statechange", installedUpdate);
    };
    const install = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    document.addEventListener("visibilitychange", visible);
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(value => {
        if (!active) return;
        registration = value;
        if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", updateFound);
        if (registration.installing) updateFound();
        return navigator.serviceWorker.ready;
      }).then(value => { if (active && value) setReady(true); }).catch(() => {});
    }
    return () => {
      active = false;
      registration?.removeEventListener("updatefound", updateFound);
      installing?.removeEventListener("statechange", installedUpdate);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const refresh = () => {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waitingWorker.postMessage({ type: "ACTIVATE_UPDATE" });
  };

  if (online && !installPrompt && !waitingWorker) return null;
  return (
    <aside className="pwa-status" aria-label="App connection and installation">
      {!online && <p role="status"><WifiOff size={17} aria-hidden="true" /><span>Offline · Showing saved records. New duty shifts will sync when connected. Other changes need internet.</span></p>}
      {online && waitingWorker && <div className="pwa-update-notice"><p role="status">An app update is ready. Save your work before refreshing.</p><button type="button" onClick={refresh}><RefreshCw size={17} aria-hidden="true" />Refresh app</button></div>}
      {online && installPrompt && <button type="button" onClick={install}><Download size={17} aria-hidden="true" />Install Duty-Tracker{ready ? " · Offline ready" : ""}</button>}
    </aside>
  );
}
