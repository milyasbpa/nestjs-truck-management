-- logs.detect_lane_simpang_bayah definition

-- Drop table

-- DROP TABLE logs.detect_lane_simpang_bayah;

CREATE TABLE logs.detect_lane_simpang_bayah (
	id int4 NOT NULL,
	created_at timestamptz NULL,
	CONSTRAINT detect_lane_simpang_bayah_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_id_detect_lane_simpang_bayah ON logs.detect_lane_simpang_bayah USING btree (id);
ALTER TABLE  logs.detect_lane_simpang_bayah OWNER TO dev_rppj;

CREATE OR REPLACE FUNCTION logs.flog_detect_changes_in_bayah_lane()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert entri baru ke logs.cp_queuement_changes setiap kali ada insert atau update
    IF NEW.device_status='IN-SB' THEN
		IF NEW.lane_id IS NOT NULL THEN 
			INSERT INTO logs.detect_lane_simpang_bayah (id, created_at)
		    VALUES (NEW.lane_id, NOW())
		    ON CONFLICT (id) DO UPDATE
		    SET created_at = EXCLUDED.created_at;
	    END IF;
	    IF OLD.lane_id IS NOT NULL THEN 
			INSERT INTO logs.detect_lane_simpang_bayah (id, created_at)
		    VALUES (OLD.lane_id, NOW())
		    ON CONFLICT (id) DO UPDATE
		    SET created_at = EXCLUDED.created_at;
	    END IF;
	END IF;
    RETURN NEW;
END;
$function$
;


CREATE TRIGGER trg_after_insert_update_device_at_sb 
AFTER
INSERT
    OR
UPDATE OR 
DELETE 
    ON
    device_at_simpang_bayah 
FOR EACH ROW EXECUTE FUNCTION logs.flog_detect_changes_in_bayah_lane();

DROP TRIGGER IF EXISTS after_lanes_change ON  LANES;
CREATE OR REPLACE FUNCTION logs.flog_detect_changes_lanes_master()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert entri baru ke logs.cp_queuement_changes setiap kali ada insert atau update
		IF NEW.id IS NOT NULL THEN 
			INSERT INTO logs.detect_lane_simpang_bayah (id, created_at)
		    VALUES (NEW.id, NOW())
		    ON CONFLICT (id) DO UPDATE
		    SET created_at = EXCLUDED.created_at;
	    END IF;
	    IF OLD.id  IS NOT NULL THEN 
			INSERT INTO logs.detect_lane_simpang_bayah (id, created_at)
		    VALUES (OLD.id, NOW())
		    ON CONFLICT (id) DO UPDATE
		    SET created_at = EXCLUDED.created_at;
	    END IF;
    RETURN NEW;
END;
$function$
;
CREATE TRIGGER trg_after_insert_update_lanes AFTER 
INSERT OR UPDATE OR DELETE ON lanes 
FOR EACH ROW EXECUTE FUNCTION logs.flog_detect_changes_lanes_master();
