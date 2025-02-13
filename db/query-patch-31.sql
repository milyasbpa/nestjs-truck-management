   create table logs.cpqa_last_completed(
	   assignment_id numeric primary key,
	   created_at timestamp with time zone default now()
   );
ALTER TABLE cpqa_last_completed OWNER TO dev_rppj;   
   
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


CREATE OR REPLACE FUNCTION notify_every_lanes_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Kirim notifikasi ke channel PostgreSQL
    PERFORM pg_notify('table_changes', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'id', 
    CASE 
	WHEN TG_OP = 'DELETE' THEN OLD.id 
	WHEN TG_OP = 'UPDATE' THEN OLD.id
	ELSE 
    NEW.id END
	)::text);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
ALTER FUNCTION notify_every_lanes_changes OWNER TO dev_rppj;
CREATE or replace TRIGGER logs_lanes_trigger_changes
AFTER INSERT OR UPDATE OR DELETE ON logs.detect_lane_changes
FOR EACH ROW EXECUTE FUNCTION notify_every_lanes_changes();
