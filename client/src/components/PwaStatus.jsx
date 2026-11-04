import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connection = () => setOnline(navigator.onLine);
    const install = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(() => setReady(true)).catch(() => {});
    }
    return () => {
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (online && !installPrompt) return null;
  return (
    <aside className="pwa-status" aria-label="App connection and installation">
      {!online && <p role="status"><WifiOff size={17} aria-hidden="true" /><span>Offline · Showing saved records. New duty shifts will sync when connected. Other changes need internet.</span></p>}
      {online && installPrompt && <button type="button" onClick={install}><Download size={17} aria-hidden="true" />Install Duty-Tracker{ready ? " · Offline ready" : ""}</button>}
    </aside>
  );
}
