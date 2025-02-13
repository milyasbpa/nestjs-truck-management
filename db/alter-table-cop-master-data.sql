-- Drop the old 'status' column if it exists
ALTER TABLE cp_devices DROP COLUMN IF EXISTS status;
ALTER TABLE cp_units DROP COLUMN IF EXISTS status;

-- Add the new 'status' column with INT type and default value 0
ALTER TABLE cp_devices ADD COLUMN status INT DEFAULT 0;
ALTER TABLE cp_units ADD COLUMN status INT DEFAULT 0;

-- Add the other columns as per your requirement
ALTER TABLE cps
  ADD COLUMN in_lane BOOLEAN DEFAULT FALSE,
  ADD COLUMN out_lane BOOLEAN DEFAULT FALSE,
  ADD COLUMN dumping_area BOOLEAN DEFAULT FALSE,
  ADD COLUMN allow_unit VARCHAR(20);

ALTER TABLE cp_devices ADD COLUMN uid VARCHAR(120);
ALTER TABLE cp_units ADD COLUMN uid VARCHAR(120);
