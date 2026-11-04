# GeoMap

Open **GeoMap** from the main menu. The map groups recorded duty hours by facility.
Tap a marker or a facility card to see its name, total hours, and related shifts.

When adding or editing a duty log, expand **Add to GeoMap**. Enter a hospital name
and city, press **Find**, select the correct result, and save the duty log. Locations
are optional. Existing logs without coordinates keep their hours and appear in
the unmapped count; they are never guessed or automatically geocoded.

## Setup

1. Install client dependencies with `npm install` in `client`.
2. Run `node migrations/run.js --geomap-only` in `server` using its normal
   `DATABASE_URL`. The migration is additive and repeatable.
3. Restart the API server so `/api/facilities/search` is available.

The implementation uses [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html)
and [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/).
Tiles are requested on demand with visible attribution; there is no tile prefetch
or offline tile download. `VITE_MAP_TILE_URL` can select another compatible tile
URL at build time; use an attribution appropriate to that provider if changing it.

Facility lookup uses [Photon's OpenStreetMap-based search API](https://github.com/komoot/photon).
`PHOTON_SEARCH_URL` on the server can point to another Photon instance (include its
`/api/` path). Searches are explicitly triggered, authenticated, limited to one
upstream request per 1.1 seconds per server process, and cached in memory for 24
hours (up to 250 queries). The public demo server supports reasonable usage without
an availability guarantee. For heavier use or multiple API instances, configure
a dedicated provider and shared rate limiting/cache.

No browser GPS permission is requested. Only the facility search text is sent to
the search provider. Duty dates, student identifiers, and hours are not sent to it.

## Working without a connection

Once the app is loaded, new duty logs can be saved to this browser's local storage
without a connection. They show **Waiting to sync** and automatically upload when
the connection returns or the app is opened again while signed in. A stable entry
ID prevents duplicate records on retries. Offline records are separated by account.
The queue persists across sign-out and is uploaded only when that same account
signs in again. Avoid clearing browser data until pending shifts have synced.

GeoMap can show cached records and queued shifts offline; uncached map tiles and
new facility searches need a connection. Existing facilities can be added to a log
before going offline. Offline editing of synced records and loading the entire app
for the first time offline are not supported. If local storage is unavailable,
online saving still works, while offline saving displays an error.

## Verification

```sh
# client
node --test tests/avatar.test.mjs tests/geomap.test.mjs
npm run build

# server
node --test controllers/authController.test.js controllers/dutyLogController.test.js controllers/facilityController.test.js
node scripts/verify-geomap.cjs
```

The database check uses temporary users and records in a transaction and always
rolls back. Browser smoke testing requires Chrome (override `CHROME_PATH` if
necessary) and a client dev server on port 5178:

```sh
# client, terminal 1
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
# client, terminal 2
node scripts/verify-geomap-browser.mjs
```

The browser check uses an isolated temporary profile and mocked API records; it
checks marker details, layout widths, facility selection, offline saving, reconnect
sync, and new markers. It never uses a real student account or requests map tiles.
