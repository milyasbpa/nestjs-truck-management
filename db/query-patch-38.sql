ALTER TABLE queue_lane_rules DISABLE TRIGGER after_queue_lane_rules_change;
DROP TRIGGER IF EXISTS after_queue_lane_rules_change ON queue_lane_rules;
CREATE OR REPLACE FUNCTION logs.flog_detect_queue_lane_rules_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.queue_lane_id IS NOT NULL THEN 
		INSERT INTO logs.detect_lane_changes (id, created_at)
	    VALUES (NEW.queue_lane_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
    END IF;
    IF OLD.queue_lane_id IS NOT NULL THEN 
		INSERT INTO logs.detect_lane_changes (id, created_at)
	    VALUES (OLD.queue_lane_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
    END IF;
   
    RETURN NEW;
END;
$function$
;
 create or replace trigger after_queue_lane_rules_change after
insert
    or
update or delete
    on
    public.queue_lane_rules  for each row execute 
    function logs.flog_detect_queue_lane_rules_changes();

ALTER TABLE queue_lane_rules ENABLE trigger after_queue_lane_rules_change;



-- DROP FUNCTION public.set_keylocked_simpang_bayah();
CREATE OR REPLACE FUNCTION public.set_keylocked_simpang_bayah()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    random_key TEXT;
    new_keylocked TEXT;
    truck_id_ TEXT;
BEGIN
    -- Determine truck_id based on operation
    IF TG_OP = 'INSERT' THEN
        truck_id_ := NEW.truck_id::TEXT;
        NEW.keylocked := truck_id_;
    ELSIF TG_OP = 'UPDATE' THEN
        truck_id_ := OLD.truck_id::TEXT;
        IF NEW.status != 'EXIT-CP' THEN
            IF OLD.keylocked != truck_id_ THEN
                NEW.keylocked := truck_id_;
            END IF;
        END IF;
    END IF;

    -- Update timestamps based on status
    IF NEW.status IN ('IN-SB') THEN
        NEW.exit_sb_time := NULL;
        NEW.exit_cp_time := NULL;
    ELSIF NEW.status IN ('EXIT-SB') THEN
        NEW.exit_sb_time := NOW();
        NEW.exit_cp_time := NULL;
    ELSIF NEW.status IN ('EXIT-CP') THEN
        NEW.exit_cp_time := NOW();
    END IF;

    -- Handle 'COMPLETED' status
    NEW.auditupdate := NOW();
    IF NEW.status = 'EXIT-CP' THEN
        -- Generate random key (20 alphanumeric characters)
        LOOP
            random_key := substring(md5(random()::TEXT) FROM 1 FOR 20);
            new_keylocked := CONCAT(truck_id_, '-', random_key);

            -- Ensure keylocked uniqueness
            IF NOT EXISTS (
                SELECT 1
                FROM device_at_simpang_bayah  
                WHERE keylocked = new_keylocked
            ) THEN
                EXIT; -- Exit loop if no conflict
            END IF;
        END LOOP;

        -- Assign the unique keylocked value
        NEW.keylocked := new_keylocked;
    END IF;

    RETURN NEW; -- Return modified row
END;
$function$
;


