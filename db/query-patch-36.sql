ALTER TABLE device_at_simpang_bayah ADD COLUMN lane_id int4;
ALTER TABLE device_at_simpang_bayah OWNER TO dev_rppj;

CREATE OR REPLACE FUNCTION logs.log_cp_queue_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert a new entry into logs.cp_queuement_changes for every insert or update
    INSERT INTO logs.cp_queuement_changes (assignment_id, created_at)
    VALUES (NEW.assignment_id, NOW())
    ON CONFLICT (assignment_id) DO UPDATE
    SET created_at = EXCLUDED.created_at;
    IF TG_OP = 'INSERT' THEN
        IF NEW.lane_id IS NOT NULL THEN
            INSERT INTO logs.detect_lane_changes (id, created_at)
            VALUES (NEW.lane_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;
        IF NEW.cp_queue_id IS NOT NULL THEN
            INSERT INTO logs.detect_cps_changes (id, created_at)
            VALUES (NEW.cp_queue_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'COMPLETED' THEN
            INSERT INTO logs.cpqa_last_completed (assignment_id, created_at)
            VALUES (NEW.assignment_id, NOW())
            ON CONFLICT (assignment_id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        ELSE
            DELETE FROM logs.cpqa_last_completed
            WHERE assignment_id = OLD.assignment_id;
        END IF;

        IF OLD.cp_queue_id IS NOT NULL AND NEW.cp_queue_id IS NOT NULL AND OLD.cp_queue_id != NEW.cp_queue_id THEN
            INSERT INTO logs.detect_cps_changes (id, created_at)
            VALUES (NEW.cp_queue_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;

            INSERT INTO logs.detect_cps_changes (id, created_at)
            VALUES (OLD.cp_queue_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        ELSIF OLD.cp_queue_id IS NULL AND NEW.cp_queue_id IS NOT NULL THEN
            INSERT INTO logs.detect_cps_changes (id, created_at)
            VALUES (NEW.cp_queue_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;

        IF OLD.lane_id IS NOT NULL AND NEW.lane_id IS NOT NULL AND OLD.lane_id != NEW.lane_id THEN
            INSERT INTO logs.detect_lane_changes (id, created_at)
            VALUES (NEW.lane_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;

            INSERT INTO logs.detect_lane_changes (id, created_at)
            VALUES (OLD.lane_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;
		
       IF NEW.status = 'IN-SB' THEN
     	    IF OLD.cp_queue_id IS NOT NULL THEN
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (OLD.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            IF NEW.lane_id IS NOT NULL THEN
	            INSERT INTO logs.detect_lane_changes (id, created_at)
	            VALUES (NEW.lane_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            
           IF OLD.lane_id IS NOT NULL THEN
	            INSERT INTO logs.detect_lane_changes (id, created_at)
	            VALUES (OLD.lane_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
        END IF;
        IF NEW.status = 'WAITING' OR  NEW.status = 'ASSIGNED_TO_CP_QUEUE' THEN
            IF OLD.cp_queue_id IS NOT NULL THEN
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (OLD.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            IF NEW.lane_id IS NOT NULL THEN
	            INSERT INTO logs.detect_lane_changes (id, created_at)
	            VALUES (NEW.lane_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            IF OLD.lane_id IS NOT NULL THEN
	            INSERT INTO logs.detect_lane_changes (id, created_at)
	            VALUES (OLD.lane_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
        END IF;

        IF NEW.status = 'ASSIGNED_TO_CP' OR NEW.status = 'ARRIVED'  THEN
            IF OLD.lane_id IS NOT NULL AND OLD.cp_queue_id IS NULL AND NEW.cp_queue_id IS NOT NULL THEN
                INSERT INTO logs.detect_lane_changes (id, created_at)
                VALUES (OLD.lane_id, NOW())
                ON CONFLICT (id) DO UPDATE
                SET created_at = EXCLUDED.created_at;
            END IF;
			IF NEW.cp_queue_id IS NOT NULL THEN
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (NEW.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            IF OLD.cp_queue_id IS NOT NULL THEN
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (OLD.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
           

        END IF;

        IF NEW.status = 'COMPLETED' THEN
            IF OLD.lane_id IS NOT NULL THEN
                INSERT INTO logs.detect_lane_changes (id, created_at)
                VALUES (OLD.lane_id, NOW())
                ON CONFLICT (id) DO UPDATE
                SET created_at = EXCLUDED.created_at;
            END IF;
    		IF OLD.cp_queue_id IS NOT NULL THEN	
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (OLD.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
            END IF;
            IF NEW.cp_queue_id IS NOT NULL THEN	
	            INSERT INTO logs.detect_cps_changes (id, created_at)
	            VALUES (OLD.cp_queue_id, NOW())
	            ON CONFLICT (id) DO UPDATE
	            SET created_at = EXCLUDED.created_at;
           END IF;
        END IF;

    ELSE -- Other operations
        IF OLD.cp_queue_id IS NOT NULL THEN
            INSERT INTO logs.detect_cps_changes (id, created_at)
            VALUES (OLD.cp_queue_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;

        IF NEW.lane_id IS NOT NULL THEN
            INSERT INTO logs.detect_lane_changes (id, created_at)
            VALUES (NEW.lane_id, NOW())
            ON CONFLICT (id) DO UPDATE
            SET created_at = EXCLUDED.created_at;
        END IF;
    END IF;
	RAISE NOTICE 'OLD STATUS:%,NEW STATUS:%',OLD.status,NEW.status;
    RETURN NEW;
END;
$function$
;

