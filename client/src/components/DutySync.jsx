import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { syncDutyLogs } from "../services/dutyLogs";

export default function DutySync() {
  const { user } = useContext(AuthContext);
  useEffect(() => {
    if (!user) return;
    const sync = () => { syncDutyLogs().catch(() => {}); };
    const visible = () => { if (document.visibilityState === "visible") sync(); };
    sync();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", visible);
    return () => { window.removeEventListener("online", sync); document.removeEventListener("visibilitychange", visible); };
  }, [user]);
  return null;
}
