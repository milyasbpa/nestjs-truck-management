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
	
	    UPDATE device_at_simpang_bayah dsb set  
		exit_cp_time=now(), device_status='EXIT-CP' 
		where 
		truck_id=OLD.truck_id and dsb.device_status in('EXIT-SB','IN-SB');
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

UPDATE cp_queue_assignments AS cpqa
SET nomor_lambung = t.nomor_lambung
FROM trucks AS t
WHERE cpqa.nomor_lambung IS NULL
  AND cpqa.truck_id = t.id;

create or replace function fsetdefault_nomorlambung() returns trigger as 
$$ 
begin 
	
	if NEW.nomor_lambung is null or NEW.nomor_lambung=''then
	select t.nomor_lambung into NEW.nomor_lambung from trucks t where t.id=NEW.truck_id;
    end if;
    return NEW;
end;
$$ language plpgsql;


create trigger trg_fsetdefault_nomorlambung before
insert
    or
update
    on
    public.cp_queue_assignments for each row execute function fsetdefault_nomorlambung();
