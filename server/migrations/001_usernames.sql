BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
LOCK TABLE users IN ACCESS EXCLUSIVE MODE;

-- Preserve existing usernames and assign email-based usernames to older accounts.
DO $$
DECLARE
  account RECORD;
  base_name TEXT;
  candidate TEXT;
  suffix INTEGER;
BEGIN
  FOR account IN SELECT id, email FROM users WHERE username IS NULL ORDER BY id LOOP
    base_name := LEFT(REGEXP_REPLACE(LOWER(SPLIT_PART(COALESCE(account.email, ''), '@', 1)), '[^a-z0-9_.-]', '', 'g'), 40);
    IF LENGTH(base_name) < 3 THEN
      base_name := 'user_' || base_name;
    END IF;
    candidate := base_name;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM users WHERE LOWER(username) = candidate) LOOP
      candidate := base_name || '_' || suffix;
      suffix := suffix + 1;
    END LOOP;
    UPDATE users SET username = candidate WHERE id = account.id;
  END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (LOWER(username));

COMMIT;
