BEGIN;

ALTER TABLE duty_logs
  ADD COLUMN IF NOT EXISTS facility_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS facility_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS facility_address TEXT,
  ADD COLUMN IF NOT EXISTS facility_place_id TEXT,
  ADD COLUMN IF NOT EXISTS client_entry_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS duty_logs_client_entry_unique
  ON duty_logs (user_id, client_entry_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duty_logs_facility_coordinates_check' AND conrelid = 'duty_logs'::regclass) THEN
    ALTER TABLE duty_logs ADD CONSTRAINT duty_logs_facility_coordinates_check CHECK (
      (facility_latitude IS NULL AND facility_longitude IS NULL) OR
      (facility_latitude IS NOT NULL AND facility_longitude IS NOT NULL AND
       facility_latitude BETWEEN -90 AND 90 AND facility_longitude BETWEEN -180 AND 180)
    );
  END IF;
END $$;

COMMIT;
