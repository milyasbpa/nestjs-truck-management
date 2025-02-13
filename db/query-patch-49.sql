-- DROP FUNCTION logs.log_truck_status();
CREATE OR REPLACE FUNCTION fget_cps(input_ numeric) 
RETURNS text AS
$$
DECLARE
    name_ text;
BEGIN
    -- Try to fetch the queue_name
    SELECT queue_name INTO name_ FROM cp_queues cq WHERE queue_id = input_;
    
    -- If no row is found, return a default value or NULL
    IF NOT FOUND THEN
        RETURN ''; -- You can adjust this message as needed
    END IF;

    -- Return the name of the queue
    RETURN name_;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM queue_lane ql 

CREATE OR REPLACE FUNCTION fget_queue_lane(input_ numeric) 
RETURNS text AS
$$
DECLARE
    name_ text;
BEGIN
    -- Try to fetch the queue_name
    SELECT lane_name INTO name_ FROM queue_lane ql WHERE id = input_;
    
    -- If no row is found, return a default value or NULL
    IF NOT FOUND THEN
        RETURN ''; -- You can adjust this message as needed
    END IF;

    -- Return the name of the queue
    RETURN name_;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION logs.log_truck_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    _result TEXT := '';
    _name TEXT := '';
BEGIN
    -- Determine description based on NEW.status
    IF NEW.status = 'IN-SB' THEN
        _result := 'Unit Masuk Simpang Bayah ' || COALESCE(NEW.lane_sb, '');

    ELSIF NEW.status = 'WAITING' THEN
        IF NEW.cp_queue_id IS NULL AND OLD.cp_queue_id IS NULL THEN
            _result := 'Unit Masuk Antrian CP Dari ' || COALESCE(NEW.lane_sb, '');
        ELSIF OLD.cp_queue_id IS NOT NULL AND NEW.cp_queue_id IS NULL THEN
            _result := 'Unit Kembali Masuk Antrian CP Dari ' || fget_cps(OLD.cp_queue_id);
        END IF;

    ELSIF NEW.status = 'ASSIGNED_TO_CP' THEN
        IF OLD.cp_queue_id IS NULL AND NEW.cp_queue_id IS NOT NULL THEN
            _result := 'Unit Di Arahkan ke ' || fget_cps(NEW.cp_queue_id) || 
                       ' Dari Videotron ANRIAN ' || fget_queue_lane(NEW.lane_id);
        ELSIF OLD.cp_queue_id IS NOT NULL AND NEW.cp_queue_id IS NOT NULL AND OLD.cp_queue_id != NEW.cp_queue_id THEN
            _result := 'Unit Di Arahkan ke ' || fget_cps(NEW.cp_queue_id) || 
                       ' Dari ' || fget_cps(OLD.cp_queue_id);
        END IF;

    ELSIF NEW.status = 'ARRIVED' THEN
        _result := 'Tiba Di ' || fget_cps(NEW.cp_queue_id);

    ELSIF NEW.status = 'COMPLETED' THEN
        _result := 'Selesai';
        
        -- Update device status for COMPLETED
        UPDATE device_at_simpang_bayah dsb
        SET exit_cp_time = NOW(), device_status = 'EXIT-CP'
        WHERE dsb.truck_id = OLD.truck_id AND dsb.device_status IN ('EXIT-SB', 'IN-SB');
    END IF;

    -- Append user information if available
    IF NEW.status IN ('WAITING', 'ASSIGNED_TO_CP', 'ARRIVED', 'COMPLETED') THEN
        IF NEW.created_by IS NOT NULL AND OLD.created_by IS NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.created_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || COALESCE(_name, 'Sistem');
        ELSIF NEW.updated_by IS NOT NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.updated_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || COALESCE(_name, 'Sistem');
        END IF;

        IF NEW.status = 'COMPLETED' AND NEW.completed_by IS NOT NULL THEN
            _result := _result || ' \n Diselesaikan oleh ' || NEW.completed_by;
        END IF;
    END IF;

    -- Insert log into truck_history_cp if _result is not empty
    IF _result != '' THEN
        INSERT INTO logs.truck_history_cp (
            assignment_id,
            truck_id,
            status,
            description,
            created_at,
            created_at_to_date
        ) VALUES (
            NEW.assignment_id,
            NEW.truck_id,
            NEW.status,
            _result,
            NOW(),
            NOW()::DATE
        );
    END IF;

    RETURN NEW;
END;
$function$;

ALTER TABLE cp_queue_assignments ADD COLUMN assigned_by varchar(255) DEFAULT 'System';
CREATE index idx_assigned_by ON cp_queue_assignments(assigned_by);

