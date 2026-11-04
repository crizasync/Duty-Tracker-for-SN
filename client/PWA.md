# Offline use and installation

Run `npm run build` and serve `dist` over HTTPS (localhost also works). The service worker is enabled in production builds only. Open the app online once and allow the app assets to finish downloading before going offline.

Use the Install Duty Tracker button when offered by the browser. On iOS, use Safari's Share > Add to Home Screen.

On mobile layouts (under 1024px), opening/reloading the app, leaving it in the background, navigating away or 15 minutes of inactivity requires a fresh online sign-in. Desktop layouts can restore an existing signed-in session offline. While a mobile session remains active, previously fetched dashboard, profile, procedures and reflections are available from this account's device cache. Duty logs can be created offline and sync while the app is open after reconnecting. Unsynced shifts remain on the device after sign-out, ready for the same account's next sign-in. Offline dashboard values reflect the last server response until refreshed online.

First-time sign-in, registration, profile uploads, edits/deletions of server records, new procedures/reflections, PDF downloads, facility searches and uncached map tiles require a connection. Cached records remain on this device; sign-out removes access to them in the app, and each account uses its own cache.

New builds install in the background and activate after existing app windows close, keeping each open session's assets consistent.

Manual check: serve the production build, sign in, visit record pages, create a shift, then switch the browser offline. Reload `/dashboard` and `/duty-logs`, create another shift, and verify it is marked waiting to sync. Reconnect with the app open and verify one server record is created. Sign out and check another account cannot see the first account's cached views.
