CREATE OR REPLACE FUNCTION public.set_keylocked()
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
        IF NEW.status != 'COMPLETED' THEN
            IF OLD.keylocked != truck_id_ THEN
                NEW.keylocked := truck_id_;
            END IF;
        END IF;
    END IF;
    -- Update timestamps based on status
   IF NEW.status IN ('IN-SB') THEN
        RAISE NOTICE  'IN-SB CECK % - %',NEW.truck_id,OLD.truck_id;
        UPDATE device_at_simpang_bayah SET device_status='IN-SB',
        exit_sb_time=null,exit_cp_time=NULL,keylocked=NEW.truck_id,auditupdate=now() WHERE  
        id IN (SELECT id FROM device_at_simpang_bayah where truck_id=NEW.truck_id ORDER BY auditupdate DESC limit 1);
   ELSIF NEW.status IN ('WAITING') THEN
        NEW.exit_cp_time := NULL;
        NEW.exit_time := NULL;
        UPDATE device_at_simpang_bayah SET device_status='EXIT-SB',
        exit_sb_time=NOW(),exit_cp_time=NULL,keylocked=NEW.truck_id,auditupdate=now() WHERE  
        id IN (SELECT id FROM device_at_simpang_bayah where truck_id=NEW.truck_id ORDER BY auditupdate DESC limit 1);
  ELSIF NEW.status IN ('ASSIGNED_TO_CP') OR NEW.status::TEXT = 'ASSIGNED_TO_CP_QUEUE' THEN
        NEW.exit_cp_time := NULL;
        NEW.exit_time := NOW();
  END IF;

    -- Handle 'COMPLETED' status
    NEW.auditupdate := NOW();
    IF NEW.status = 'COMPLETED' THEN
        -- Generate random key (20 alphanumeric characters)
        LOOP
            random_key := substring(md5(random()::TEXT) FROM 1 FOR 20);
            new_keylocked := CONCAT(truck_id_, '-', random_key);

            -- Ensure keylocked uniqueness
            IF NOT EXISTS (
                SELECT 1
                FROM cp_queue_assignments
                WHERE keylocked = new_keylocked
            ) THEN
                EXIT; -- Exit loop if no conflict
            END IF;
        END LOOP;

        -- Assign the unique keylocked value
        NEW.keylocked := new_keylocked;
       	NEW.exit_cp_time=now();
        
        UPDATE device_at_simpang_bayah SET device_status='EXIT-CP',
	    exit_cp_time=now(),keylocked=NEW.truck_id,auditupdate=now() WHERE  
	    id IN (SELECT id FROM device_at_simpang_bayah where truck_id=NEW.truck_id ORDER BY auditupdate DESC limit 1);
        
        
    END IF;

    RETURN NEW; -- Return modified row
END;
$function$
;
