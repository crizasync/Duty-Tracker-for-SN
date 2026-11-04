const cache = new Map();
let nextRequestAt = 0;

// Explicit searches only: no GPS, background lookups, or autocomplete requests.
exports.searchFacilities = async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 3 || query.length > 160) return res.status(400).json({ message: "Enter a hospital name and city (3–160 characters)." });
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return res.json({ facilities: cached.facilities });
  if (Date.now() < nextRequestAt) return res.status(429).json({ message: "Please wait a moment before searching again." });
  nextRequestAt = Date.now() + 1100;
  try {
    const url = new URL(process.env.PHOTON_SEARCH_URL || "https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "6");
    url.searchParams.set("lang", "en");
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "DutyTracker/1.0 (student facility lookup)", Accept: "application/json" } });
    if (!response.ok) throw new Error("Lookup unavailable");
    const data = await response.json();
    const facilities = (data.features || []).flatMap((feature) => {
      const [longitude, latitude] = feature.geometry?.coordinates || [];
      const place = feature.properties || {};
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];
      const address = [place.street, place.district, place.city, place.state, place.country].filter(Boolean).join(", ");
      return [{ name: place.name || query, latitude, longitude, address, placeId: `${place.osm_type || "place"}:${place.osm_id || `${latitude},${longitude}`}` }];
    });
    if (cache.size >= 250) cache.delete(cache.keys().next().value);
    cache.set(key, { facilities, expires: Date.now() + 86400000 });
    res.json({ facilities });
  } catch {
    res.status(503).json({ message: "Location search is unavailable. You can still save your duty log without a map location." });
  }
};
