-- New accounts use usernames only. Preserve historical data for existing accounts.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
