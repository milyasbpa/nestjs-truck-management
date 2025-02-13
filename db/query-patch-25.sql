alter table cp_queue_assignments add column nomor_lambung  varchar (20);
alter table cp_queue_assignments OWNER TO dev_rppj;

create table logs.detect_lane_changes(
id bigint primary key,
created_at timestamp with time zone);
ALTER TABLE logs.detect_lane_changes OWNER TO dev_rppj;

CREATE OR REPLACE FUNCTION logs.flog_detect_lane_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert entri baru ke logs.cp_queuement_changes setiap kali ada insert atau update
    INSERT INTO logs.detect_lane_changes (id, created_at)
    VALUES (NEW.id, NOW())
    ON CONFLICT (id) DO UPDATE
    SET created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER after_lanes_change
AFTER INSERT OR UPDATE ON lanes
FOR EACH ROW
EXECUTE FUNCTION logs.flog_detect_lane_changes();
ALTER TABLE lanes OWNER TO dev_rppj;


create or replace function fsetdefault_nomorlambung() returns trigger as 
$$ 
begin 
	
	if new.nomor_lambung is null or new.nomor_lambung=''then
	select t.nomor_lambung into new.nomor_lambung from trucks t where t.id=new.truck_id;
    end if;
    return new;
end;
$$ language plpgsql;


alter table cp_queue_assignments add column keylocked varchar(255);
update cp_queue_assignments set keylocked=CONCAT(truck_id::text, '_', (substring(md5(random()::text) FROM 1 FOR 20)));
alter table cp_queue_assignments add constraint keylocaked UNIQUE(keylocked);

CREATE OR REPLACE FUNCTION set_keylocked()
RETURNS TRIGGER AS $$
DECLARE
    random_key TEXT;
    new_keylocked TEXT;
    truck_id_ TEXT;
BEGIN
    -- Menentukan truck_id berdasarkan operasi
    IF TG_OP = 'INSERT' THEN
        truck_id_ := NEW.truck_id::TEXT;
        NEW.keylocked:=truck_id_;
    ELSIF TG_OP = 'UPDATE' THEN
        truck_id_ := OLD.truck_id::TEXT;
    END IF;
    
    IF NEW.status = 'WAITING' or NEW.status = 'ASSIGNED_TO_CP' or UPPER(NEW.status::TEXT) = 'ASSIGNED_TO_CP_QUEUE' 
    THEN
        NEW.exit_cp_time=null;
        NEW.exit_time=null;
    END IF;
   
    -- Jika status adalah 'COMPLETED'
	NEW.auditupdate=now();
    if  NEW.status = 'COMPLETED' then BEGIN
        -- Generate random key (panjang 20 karakter alfanumerik)
        random_key := substring(md5(random()::text) FROM 1 FOR 20);

        -- Concatenate nomor_lambung, random key
        new_keylocked := CONCAT(truck_id_, '-', random_key);

        -- Pastikan keylocked tidak conflict
        LOOP
            -- Periksa apakah keylocked sudah ada di tabel
            IF NOT EXISTS (
                SELECT 1 
                FROM cp_queue_assignments 
                WHERE keylocked = new_keylocked
            ) THEN
                EXIT; -- Jika tidak ada konflik, keluar dari loop
            END IF;

            -- Jika ada konflik, generate random key baru
            random_key := substring(md5(random()::text) FROM 1 FOR 20);
            new_keylocked := CONCAT(truck_id_, '-', random_key);
        END LOOP;

        -- Tetapkan nilai keylocked
        NEW.keylocked := new_keylocked;
    end;
    end if;
    RETURN NEW; -- Kembalikan baris yang dimodifikasi
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_update_cp_queue
BEFORE INSERT OR UPDATE ON cp_queue_assignments
FOR EACH ROW
EXECUTE FUNCTION set_keylocked();
create index idxkeylocked on cp_queue_assignments(keylocked);
ALTER TABLE cp_queue_assignments OWNER TO dev_rppj;
