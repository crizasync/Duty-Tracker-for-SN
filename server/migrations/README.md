Run `npm run migrate` from `server` before starting the updated application.
For the persistent profile image update alone, run `node migrations/run.js --avatars-only`.
New avatars are stored in PostgreSQL instead of relying on Render's temporary filesystem.
Existing `/uploads/...` URLs still work while their files exist; images already lost on
the host must be uploaded again. The app does not impose a profile image MB limit.
The migration uses `DATABASE_URL` from the server environment.

Existing accounts receive the part of their email before `@`, lowercased and
with characters other than letters, numbers, dots, underscores, and hyphens
removed (up to 40 characters). Names shorter than three characters receive a
`user_` prefix. Duplicate usernames receive `_1`, `_2`, etc.

Usernames are unique without regard to case. New accounts choose a username
during registration. Registration and profiles no longer use email. The second
migration removes the database's email requirement while preserving historical
email values for existing accounts.
The migration can be rerun safely and preserves assigned usernames.

GeoMap adds nullable facility coordinates, address, and OpenStreetMap place ID
to duty logs. Existing records and hours are preserved and remain valid without
a location. A per-student client entry ID prevents duplicate offline uploads.
On an already configured database, run only this migration with:

```sh
node migrations/run.js --geomap-only
```
