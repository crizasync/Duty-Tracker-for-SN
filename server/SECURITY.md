# Security controls

New passwords use bcrypt with a random salt and cost 12. Registration requires at least 8 characters. The server also enforces bcrypt?s 72-byte input boundary to prevent silent truncation; this technical limit is not shown in the UI. Existing bcrypt hashes remain compatible. Passwords and hashes are never returned by the authentication API.

Login allows 10 failed attempts per normalized username and IP per 15 minutes, plus 50 total attempts per IP per 15 minutes. Registration and PDF downloads do not have request rate limits. Limits return HTTP 429 and Retry-After. Limits currently use process memory: multiple server instances need a shared rate-limit store, and restarting the server resets counters. Behind a reverse proxy, set TRUST_PROXY_HOPS only to the actual trusted hop count, and restrict direct backend access so clients cannot forge forwarded addresses.

SQL values remain PostgreSQL bound parameters; only application-owned fragments form query structure. Input validation rejects operator-shaped objects, prototype keys, duplicate filters and non-string text fields without deleting legitimate apostrophes or SQL words from notes. Body parsers cap requests at 100 KB. Multipart profile inputs are validated after parsing too.

JWT verification accepts only HS256 bearer tokens with an account ID and checks expiry. Set JWT_SECRET to a cryptographically random secret (at least 32 bytes), keep it out of source control, and serve the app and API through HTTPS.

PDF routes require authentication and use only the verified account ID for their queries. Reports use attachment filenames defined by the app, private/no-store headers and nosniff. Data is rendered as text, with control characters removed and length caps (500 characters per short field, 12,000 per reflection). More than 1,000 records returns 413 rather than silently omitting records. PDFs are not password encrypted; an authorized user can retain or share a downloaded file. The response headers cannot revoke downloaded files or prevent local copies.

Offline JSON records intentionally remain in account-scoped browser storage to support the PWA. PDF responses and authentication responses are excluded from offline caching.

Run `node --test security.test.js controllers/*.test.js` for authentication, input/operator, SQL parameter binding, ownership, rate limit and PDF checks.
