import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Hospital, MapPin, RefreshCw, WifiOff } from "lucide-react";
import MenuBar from "../components/MenuBar";
import PageHeading from "../components/PageHeading";
import FacilityMap from "../components/FacilityMap";
import { dutyRecordsEvent, getDutyLogs, syncDutyLogs } from "../services/dutyLogs";
import { groupFacilities } from "../utils/geoMap";

export default function GeoMap() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [selectedKey, setSelectedKey] = useState(null);
  const load = useCallback(() => getDutyLogs()
    .then((response) => {
      setLogs(response.data.dutyLogs || []); setOffline(Boolean(response.data.offline)); setError("");
    })
    .catch(() => setError("Your facilities couldn't be loaded. Please try again."))
    .finally(() => setLoading(false)), []);
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    const reconnect = () => { syncDutyLogs().then(load).catch(load); };
    const disconnected = () => setOffline(true);
    window.addEventListener(dutyRecordsEvent, load);
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", disconnected);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener(dutyRecordsEvent, load); window.removeEventListener("online", reconnect); window.removeEventListener("offline", disconnected); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  const { facilities, unmapped } = useMemo(() => groupFacilities(logs), [logs]);
  const selected = facilities.find((facility) => facility.key === selectedKey) || facilities[0];
  const totalHours = facilities.reduce((sum, facility) => sum + facility.totalHours, 0);
  const pending = logs.filter((log) => log.pending).length;

  return (
    <div className="app-page geomap-page min-h-screen p-4 md:p-6"><div className="mx-auto max-w-6xl space-y-5">
      <MenuBar />
      <section className="rounded-3xl border border-pink-200 bg-white p-6"><PageHeading eyebrow="GEOMAP" title="Places you care" description="Your duty journey, one pin at a time."><Link to="/duty-logs" className="page-heading-badge page-heading-primary-action"><MapPin size={16} /> Manage duty logs</Link></PageHeading></section>
      {offline && <p className="geo-notice" role="status"><WifiOff size={18} /> You're offline. Showing records saved on this device.</p>}
      {pending > 0 && <p className="geo-notice" role="status">{pending} {pending === 1 ? "shift is" : "shifts are"} waiting to sync. These hours are marked as pending.</p>}
      <div className="geo-summary"><div><Hospital size={20} /><span><strong>{facilities.length}</strong> mapped facilities</span></div><div><Clock3 size={20} /><span><strong>{totalHours.toFixed(2)}</strong> mapped hours</span></div><button type="button" onClick={() => { setLoading(true); load(); }} disabled={loading}><RefreshCw size={17} /> Refresh</button></div>
      {error ? <div className="geo-notice" role="alert">{error}</div> : <>
        <section className="geo-map-card rounded-3xl border border-pink-200 bg-white p-6" aria-labelledby="geomap-title"><div className="geo-section-heading"><h2 id="geomap-title">Your facilities</h2><span><MapPin size={14} /> Tap a pin to explore</span></div>{loading && <p role="status" className="geo-loading">Loading your journey...</p>}<FacilityMap facilities={facilities} selectedKey={selectedKey} onSelect={setSelectedKey} />
          {!loading && facilities.length === 0 && <div className="geo-empty"><MapPin size={25} /><h3>Your first pin is waiting</h3><p>Open a duty log and choose “Add to GeoMap” to link its hospital. Existing logs without locations stay saved.</p><Link to="/duty-logs">Open duty logs</Link></div>}
        </section>
        {facilities.length > 0 && <div className="geo-detail-layout"><section className="rounded-3xl border border-pink-200 bg-white p-6" aria-label="Choose a facility"><h2>Places you've helped</h2><div className="geo-facility-list">{facilities.map((facility) => <button key={facility.key} type="button" aria-pressed={selected?.key === facility.key} onClick={() => setSelectedKey(facility.key)}><span className="geo-facility-icon"><Hospital size={22} /></span><span><strong>{facility.name}</strong><small>{facility.logs.length} duty {facility.logs.length === 1 ? "log" : "logs"}</small></span><b>{facility.totalHours.toFixed(2)}h</b></button>)}</div></section>
          {selected && <section id="geo-facility-details" className="rounded-3xl border border-pink-200 bg-white p-6" aria-live="polite"><h2>{selected.name}</h2><p className="geo-address">{selected.address || "Saved facility location"}</p><p className="geo-total"><Clock3 size={18} />{selected.totalHours.toFixed(2)} total hours</p><div className="geo-related-logs">{selected.logs.map((log) => <article key={log.id}><div><strong>{String(log.duty_date).slice(0, 10)}</strong><span>{log.shift} · {log.ward}</span>{log.pending && <small className="duty-pending-badge">Waiting to sync</small>}</div><b>{Number(log.total_hours || 0).toFixed(2)}h</b></article>)}</div></section>}
        </div>}
        {unmapped.length > 0 && <section className="geo-unmapped rounded-3xl border border-pink-200 bg-white p-6"><MapPin size={22} /><div><h2>{unmapped.length} {unmapped.length === 1 ? "log without a pin" : "logs without pins"}</h2><p>Hours are still recorded. Edit a duty log to add an optional facility location.</p></div><Link to="/duty-logs">Add locations</Link></section>}
      </>}
      <p className="geo-footer">No GPS tracking. Only facility locations you choose are shown. <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a></p>
    </div></div>
  );
}
