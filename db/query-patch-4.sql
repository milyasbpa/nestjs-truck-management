CREATE OR REPLACE FUNCTION log_truck_status()
RETURNS TRIGGER AS $$
DECLARE
    _result TEXT;
    _name text;
    _is_simpang_bayah BOOLEAN;
BEGIN
    -- Cek status berdasarkan kondisi
    SELECT CASE 
        WHEN NEW.status = 'WAITING' THEN 'Unit Masuk Antrian CP'
        WHEN NEW.status = 'ASSIGNED_TO_CP' THEN 'Unit Di Arahkan ke CP'
        WHEN NEW.status = 'ARRIVED' THEN 'Tiba Di CP'
        WHEN NEW.status = 'COMPLETED' THEN 'Selesai'
        ELSE NULL 
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
    
    if (new.status='WAITING') then begin
       if (new.created_by is not null) then
        begin
         	select name into _name from users where id=created_by limit 1;
	        _result=_result+ ' \n Ditugaskan oleh' + _name;
        end;
        else
        _result=_result+ ' \n Ditugaskan oleh Sistem';
        end if;
    end;
    elsif (new.status='ASSIGNED_TO_CP') then begin
        if (new.updated_by is not null) then
        begin
         	select name into _name from users where id=created_by limit 1;
	        _result=_result+ ' \n Ditugaskan oleh' + _name;
        end;
        else
             _result=_result+ ' \n Ditugaskan oleh Sistem';
        end if;

    end;
    elsif (new.status='COMPLETED') then begin
        if (new.updated_by is not null) then
        begin
         	select name into _name from users where id=created_by limit 1;
	        _result=_result+ ' \n Ditugaskan oleh' + _name;
        end; 
        else
            _result=_result+ ' \n Ditugaskan oleh Sistem';
        end if;
    end;
    else
     	_result='Selesai';
     
    end if; 
     	
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER  after_insert_update_cp_queue
AFTER INSERT OR UPDATE
ON public.cp_queue_assignments
FOR EACH ROW
EXECUTE FUNCTION log_truck_status();


create or replace function isTruckInAroundBayahLane(_input bigint) 
returns text as 
$$
declare 
  _result boolean;
begin 
	select exists(
WITH simpang_bayah_polygon AS (
    select ST_GeomFromText(st_astext(area),4326) geom from geofences g where g.name ilike'%simpang%bayah%' limit 1
)
SELECT 
    lm.truck_id,
    lm.lat,
    lm.lng,
    lm.speed,
    CASE
        WHEN ST_Within(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), polygon.geom) THEN 'In Simpang Bayah'
        ELSE 'Before Simpang Bayah'
    END AS area,
    -- Mengambil jarak terdekat antar kendaraan dalam area yang sama
    round(MIN(ST_DistanceSphere(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), ST_SetSRID(ST_MakePoint(lm2.lng, lm2.lat), 4326)))::numeric,2) AS closest_vehicle_distance
FROM 
    last_truck_movement lm
JOIN 
    trucks t 
ON 
    t.id = lm.truck_id
CROSS JOIN 
    simpang_bayah_polygon AS polygon
-- Self join untuk membandingkan kendaraan dengan kendaraan lain dalam area yang sama
JOIN 
    last_truck_movement lm2 
ON 
    lm.truck_id != lm2.truck_id  -- Menghindari membandingkan kendaraan dengan dirinya sendiri
WHERE 
    -- Berada dalam radius 1 km dari pusat koordinat atau berada dalam poligon area Simpang Bayah
    (ST_DistanceSphere(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), ST_SetSRID(ST_MakePoint(115.6427, -3.7381), 4326)) <= 1000
     OR
     ST_Within(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), polygon.geom))  and lm.speed > 0 and lm.truck_id=_input 
GROUP BY 
    lm.truck_id,  lm.lat, lm.lng,  
    lm.speed, polygon.geom 
 ) into _result;
   
   return _result;
end;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION log_bayah_lane_entry()
RETURNS TRIGGER AS $$
DECLARE
    _result TEXT;
    _time_diff interval;
    _is_bayah_lane BOOLEAN;
    _last_entry_time TIMESTAMP with TIME ZONE;
BEGIN
		select isTruckInAroundBayahLane(new.truck_id) into _is_bayah_lane;
	    if (_is_bayah_lane is true) then 
	    begin
			_result='Unit masuk radius Simpang Bayah Lane';
	        select created_at  into _last_entry_time from logs.truck_history_cp 
			where truck_id = new.truck_id order by created_at desc limit 1;
					if _last_entry_time is not null then 
					begin
					     _time_diff := NOW() - _last_entry_time;
						if (extract(hour from _time_diff)<1) then 
							raise notice 'Truck ID May not check again within 1 hours';
						else
						    INSERT INTO logs.truck_history_cp (
					            assignment_id, 
					            truck_id, 
					            status, 
					            description, 
					            created_at, 
					            created_at_to_date
					        ) VALUES (
					            NULL,
					            NEW.truck_id,
					            'STARTED',
					            _result,
					            NOW(),
					            NOW()::DATE
					        );
					    end if;
					 end;
					 else
						 begin
			   				INSERT INTO logs.truck_history_cp (
					            assignment_id, 
					            truck_id, 
					            status, 
					            description, 
					            created_at, 
					            created_at_to_date
					        ) VALUES (
					            NULL, 
					            NEW.truck_id,
					            'STARTED',
					            _result,
					            NOW(),
					            NOW()::DATE
					        );				 
						 end;
					 end if;
				end;	
    		END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER after_insert_update_truck_movement
AFTER INSERT OR UPDATE ON last_truck_movement
FOR EACH ROW
EXECUTE FUNCTION log_bayah_lane_entry();

DROP TABLE if  exists logs.truck_history_cp;
CREATE TABLE logs.truck_history_cp (
	history_id bigserial primary key,
	assignment_id int8 NULL,
	truck_id int8 NULL,
	status varchar(50) NULL,
	description text NULL,
	created_at timestamptz default now(),
	created_at_to_date date default now()
);
CREATE index idx_trucks_id_created_at ON logs.truck_history_cp(truck_id,created_at);
drop index if exists unique_truck_entrance_date;

create index idx_assignment_id_truck_id_auditupdate  on cp_queue_assignments(assignment_id,truck_id,auditupdate);
