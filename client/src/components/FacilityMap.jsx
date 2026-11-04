import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function FacilityMap({ facilities, selectedKey, onSelect }) {
  const element = useRef(null);
  const instance = useRef(null);
  const markers = useRef(new Map());
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const map = L.map(element.current, { scrollWheelZoom: false, zoomControl: true }).setView([12.88, 121.77], 5);
    instance.current = map;
    const tiles = L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(element.current);
    const reconnect = () => { setTileError(false); tiles.redraw(); };
    window.addEventListener("online", reconnect);
    return () => { window.removeEventListener("online", reconnect); resize.disconnect(); map.remove(); instance.current = null; };
  }, []);

  useEffect(() => {
    const map = instance.current;
    const group = L.layerGroup().addTo(map);
    const currentMarkers = markers.current;
    currentMarkers.clear();
    const icon = L.divIcon({ className: "geo-marker-wrap", html: '<span class="geo-marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></span>', iconSize: [36, 44], iconAnchor: [18, 42], popupAnchor: [0, -36] });
    for (const facility of facilities) {
      const content = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = facility.name;
      const hours = document.createElement("p"); hours.textContent = `${facility.totalHours.toFixed(2)} hours · ${facility.logs.length} duty ${facility.logs.length === 1 ? "log" : "logs"}`;
      const button = document.createElement("button"); button.type = "button"; button.textContent = "View duty logs"; button.className = "geo-popup-action";
      button.addEventListener("click", () => { onSelect(facility.key); document.getElementById("geo-facility-details")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
      content.append(title, hours, button);
      const marker = L.marker([facility.latitude, facility.longitude], { icon, title: facility.name, alt: facility.name }).addTo(group).bindPopup(content);
      marker.on("click", () => onSelect(facility.key));
      currentMarkers.set(facility.key, marker);
    }
    if (facilities.length) map.fitBounds(L.latLngBounds(facilities.map((facility) => [facility.latitude, facility.longitude])), { padding: [35, 35], maxZoom: 14 });
    return () => { group.remove(); currentMarkers.clear(); };
  }, [facilities, onSelect]);

  useEffect(() => {
    const marker = markers.current.get(selectedKey);
    if (marker) { instance.current.panTo(marker.getLatLng()); marker.openPopup(); }
  }, [selectedKey, facilities]);

  return <div className="facility-map-container"><div ref={element} className="facility-map" role="region" aria-label="Map of your duty facilities" />{tileError && <p className="map-tile-error" role="status">Map tiles need a connection. Your saved facilities and logs are still available below.</p>}</div>;
}
