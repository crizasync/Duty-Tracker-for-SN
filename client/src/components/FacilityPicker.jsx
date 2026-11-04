import { useId, useRef, useState } from "react";
import { Check, MapPin, Search, X } from "lucide-react";
import api from "../services/api";

export default function FacilityPicker({ hospital, location, onChange }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef(0);
  const search = async () => {
    const searchText = (query || hospital).trim();
    if (searchText.length < 3) { setMessage("Enter a hospital name and city to find its location."); return; }
    const current = ++request.current;
    setLoading(true); setMessage(""); setResults([]);
    try {
      const response = await api.get("/facilities/search", { params: { q: searchText }, timeout: 10000 });
      if (current !== request.current) return;
      setResults(response.data.facilities || []);
      if (!response.data.facilities?.length) setMessage("No matches yet. Try adding the city, or save without a location.");
    } catch (error) {
      if (current === request.current) setMessage(error.response?.data?.message || "Search needs a connection. You can still save without a location.");
    } finally { if (current === request.current) setLoading(false); }
  };
  return (
    <details className="facility-picker md:col-span-2">
      <summary><MapPin size={17} /><span>{location ? "Location added" : "Add to GeoMap"}</span><small>Optional</small></summary>
      <p>Find your hospital on the map. No GPS permission needed.</p>
      {location && <div className="facility-selected"><Check size={17} /><span>{hospital}<small>{location.address || `${location.latitude}, ${location.longitude}`}</small></span><button type="button" aria-label="Remove map location" onClick={() => onChange(null)}><X size={17} /></button></div>}
      <label htmlFor={id}>Hospital and city</label>
      <div className="facility-search-row"><input id={id} type="search" value={query} onChange={(event) => { request.current++; setLoading(false); setResults([]); setQuery(event.target.value); }} placeholder={hospital ? `${hospital}, city` : "Hospital name, city"} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} /><button type="button" onClick={search} disabled={loading}><Search size={16} />{loading ? "Finding..." : "Find"}</button></div>
      {message && <p className="facility-message" role="status">{message}</p>}
      {results.length > 0 && <ul className="facility-results">{results.map((facility) => <li key={facility.placeId}><button type="button" onClick={() => { onChange(facility); setResults([]); setMessage("Location selected. Save your duty log to add it to GeoMap."); }}><MapPin size={17} /><span>{facility.name}<small>{facility.address}</small></span></button></li>)}</ul>}
      <a className="facility-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Location data © OpenStreetMap contributors</a>
    </details>
  );
}
