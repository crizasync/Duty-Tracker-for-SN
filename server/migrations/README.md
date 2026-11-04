Run `npm run migrate` from `server` before starting the updated application.
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
