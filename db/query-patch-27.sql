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
    _current_lane_code TEXT;
    _current_cp_queue_id INT;
BEGIN      
    -- Ambil lane_id sebelumnya jika operasi adalah UPDATE
    IF TG_OP = 'UPDATE' THEN
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
    END IF;
           
    -- Ambil informasi lane_code dan cp_queue_id untuk status saat ini
    SELECT 
        l.lane_code,
        a.cp_queue_id
    INTO   
        _current_lane_code,
        _current_cp_queue_id
    FROM   
        cp_queue_assignments a
    JOIN   
        lanes l ON a.lane_id = l.id
    WHERE  
        a.truck_id = NEW.truck_id
        AND a.assignment_id = (
            SELECT assignment_id 
            FROM cp_queue_assignments 
            WHERE truck_id = NEW.truck_id
            ORDER BY auditupdate DESC 
            LIMIT 1
        ); 
           
    -- Cek status berdasarkan kondisi dan ubah pesan sesuai kebutuhan
    SELECT CASE 
        WHEN NEW.status = 'WAITING' THEN 
            'Unit Masuk Antrian Lane ' || COALESCE(_current_lane_code, 'Tidak Diketahui')
        WHEN NEW.status = 'ASSIGNED_TO_CP' THEN 
            'Unit Di Arahkan ke CP ' || COALESCE(_current_cp_queue_id::TEXT, 'Tidak Diketahui')
        WHEN NEW.status = 'ARRIVED' THEN 
            'Tiba Di CP'
        WHEN NEW.status = 'COMPLETED' THEN 
            'Selesai'
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
           
    -- Tambahkan informasi siapa yang melakukan update berdasarkan status
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
    ELSE   
        _result := '';
    END IF;
           
    -- Jika ada hasil, masukkan ke tabel logs.truck_history_cp
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
$function$