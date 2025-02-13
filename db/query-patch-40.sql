CREATE OR REPLACE FUNCTION logs.flog_detect_cps_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    if NEW.cp_id IS NOT NULL THEN
		INSERT INTO logs.detect_cps_changes (id, created_at)
	    VALUES (NEW.cp_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
	END IF;
    if OLD.cp_id IS NOT NULL THEN
		INSERT INTO logs.detect_cps_changes (id, created_at)
	    VALUES (OLD.cp_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
	END IF;

	RETURN NEW;
END;
$function$
;

ALTER TABLE queue_lane_rules  add column overload_allowed boolean default false;
ALTER TABLE queue_lane_rules OWNER TO dev_rppj;
