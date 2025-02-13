drop table if exists device_at_simpang_bayah;

create table device_at_simpang_bayah (
	id bigserial primary key,
	truck_id numeric,
	vendor_id numeric,
	nomor_lambung varchar(20),
	driver_name varchar(255),
	truck_type varchar(5),
	contractor varchar(255),	
	lat numeric,
	lng numeric,
	geofence varchar(255),
	status varchar(20),
	speed numeric(10,2),
	course numeric(10,2),
	gps_time timestamp with time zone default now(),
	entrance_time timestamp with time zone default now(),
	exit_sb_time  timestamp with time zone default null,
	exit_cp_time  timestamp with time zone default null,
	device_status varchar(20),
	keylocked varchar(255),
	auditupdate timestamp with time zone default now()
);

ALTER TABLE device_at_simpang_bayah 
ADD CONSTRAINT keylocked_sb UNIQUE (keylocked);

CREATE TYPE device_status_enum AS ENUM ('IN-SB', 'EXIT-SB', 'EXIT-CP');

ALTER TABLE device_at_simpang_bayah 
ALTER COLUMN device_status TYPE device_status_enum 
USING device_status::device_status_enum;

ALTER TABLE device_at_simpang_bayah 
ALTER COLUMN device_status SET DEFAULT 'IN-SB';


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
    ELSIF NEW.status IN ('EXIT-SB') THEN
        NEW.exit_sb_time := NOW();
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

CREATE TRIGGER trg_set_key_locked_simpang_bayah
BEFORE INSERT OR UPDATE ON device_at_simpang_bayah
FOR EACH ROW
EXECUTE FUNCTION set_keylocked_simpang_bayah();



-- DROP FUNCTION logs.log_truck_status();

CREATE OR REPLACE FUNCTION logs.log_truck_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    _result TEXT;
    _name TEXT;
    _previous_lane_id INT;
    _new_lane_name TEXT;
    _prev_lane_name TEXT;
BEGIN
    -- Ambil lane_id sebelumnya
	--Perpindahan Lane
	raise notice 'step2';
	if TG_OP='UPDATE' THEN
		    SELECT lane_id 
		    INTO _previous_lane_id
		    FROM cp_queue_assignments
		    WHERE truck_id = NEW.truck_id
		      AND assignment_id = (
		          SELECT assignment_id 
		          FROM cp_queue_assignments 
		          WHERE truck_id = NEW.truck_id
		          ORDER BY auditupdate DESC 
		          LIMIT 1
		      );
		
		    -- Cek jika lane_id berubah
		    IF NEW.lane_id IS DISTINCT FROM _previous_lane_id THEN
		        -- Ambil nama lane baru dan lama
		        SELECT lane_code INTO _new_lane_name FROM lanes WHERE id = NEW.lane_id LIMIT 1;
		        SELECT lane_code INTO _prev_lane_name FROM lanes WHERE id = _previous_lane_id LIMIT 1;
		
		        -- Update deskripsi dengan informasi reroute
		        _result := 'Reroute ke lane ' || COALESCE(_new_lane_name, 'Tidak Diketahui') ||
		                   ' dari lane ' || COALESCE(_prev_lane_name, 'Tidak Diketahui');
		
		        -- Tambahkan informasi siapa yang melakukan update
		        IF NEW.updated_by IS NOT NULL THEN
		            SELECT name INTO _name FROM users WHERE id = NEW.updated_by LIMIT 1;
		            _result := _result || ' \n Diperbarui oleh ' || _name;
		        ELSE
		            _result := _result || ' \n Diperbarui oleh Sistem';
		        END IF;
		
		        -- Masukkan ke log reroute
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
		            'REROUTE',
		            _result,
		            NOW(),
		            NOW()::DATE
		        );
    		END IF;
    end if;	

    -- Cek status berdasarkan kondisi
    SELECT CASE 
        WHEN NEW.status = 'WAITING' THEN 'Unit Masuk Antrian CP'
        WHEN NEW.status = 'ASSIGNED_TO_CP' THEN 'Unit Di Arahkan ke CP'
        WHEN NEW.status = 'ARRIVED' THEN 'Tiba Di CP'
        WHEN NEW.status = 'COMPLETED' THEN 'Selesai'
        ELSE '' 
    END 
    INTO _result
    FROM cp_queue_assignments a
    WHERE a.truck_id = NEW.truck_id
      AND a.assignment_id = (
          SELECT assignment_id 
          FROM cp_queue_assignments 
          WHERE truck_id = NEW.truck_id
          ORDER BY auditupdate DESC 
          LIMIT 1
      );

    IF NEW.status = 'WAITING' THEN
        IF NEW.created_by IS NOT NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.created_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || _name;
        ELSE
            _result := _result || ' \n Ditugaskan oleh Sistem';
        END IF;
    ELSIF NEW.status = 'ASSIGNED_TO_CP' THEN
        IF NEW.updated_by IS NOT NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.updated_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || _name;
        ELSE
            _result := _result || ' \n Ditugaskan oleh Sistem';
        END IF;
    ELSIF NEW.status = 'ARRIVED' THEN
        IF NEW.updated_by IS NOT NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.updated_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || _name;
        ELSE
            _result := _result || ' \n Ditugaskan oleh Sistem';
        END IF;
    ELSIF NEW.status = 'COMPLETED' THEN
        IF NEW.updated_by IS NOT NULL THEN
            SELECT name INTO _name FROM users WHERE id = NEW.updated_by LIMIT 1;
            _result := _result || ' \n Ditugaskan oleh ' || _name;
        ELSE
            _result := _result || ' \n Ditugaskan oleh Sistem';
        END IF;
	update device_at_simpang_bayah dsb set  
	exit_cp_time=now(), device_status='EXIT-CP' 
	where 
	truck_id=OLD.id and dsb.device_status in('EXIT-SB','IN-SB');
    ELSE
        _result := '';
    END IF;
	
    if  _result!='' THEN
	    -- Masukkan hasil ke tabel logs.truck_history_cp
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
	end if;   

RETURN NEW;
END;
$function$
;
CREATE INDEX idx_device_at_simpang_bayah_truck_status
ON device_at_simpang_bayah (truck_id, device_status);
 
