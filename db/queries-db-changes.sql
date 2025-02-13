--Penambahan Query:
create index idx_entrance_time  on cp_queue_assignments(entrance_time)
create schema logs;
create table logs.last_job_executed(
	job_name varchar(255) primary key,
	created_at timestamp with time zone,
	auditupdate timestamp with time zone
)

create schema demo;

create table demo.truck_in_simpang_bayah(
truck_id bigint primary key,
typeoftruck varchar(100),
nomor_lambung varchar(200),
lat float,
lng float,
geofences varchar(200),
status varchar(20),
speed numeric(10,2),
cource numeric(10,2),
gps_time timestamp with time zone,
area varchar(255),
closest_vehicle_distance numeric(20,3)
);



--Insert this for simulator

insert into  demo.truck_in_simpang_bayah
WITH simpang_bayah_polygon AS (
    SELECT ST_GeomFromText(
        'POLYGON((-3.7380074630771 115.64258552481, 
                 -3.7382189067774 115.64257479597, 
                 -3.738213553773 115.64300663163, 
                 -3.7382108772708 115.64347065379, 
                 -3.7382082007686 115.64498878409, 
                 -3.7380128160829 115.64496464421, 
                 -3.7380208455913 115.64425385882, 
                 -3.7380128160829 115.64281619479, 
                 -3.7380101395799 115.64281619479, 
                 -3.7380074630771 115.64258552481))',
        4326
    ) AS geom
)
SELECT 
    lm.truck_id,
    t.typeoftruck,        -- Ambil informasi tambahan dari tabel trucks
    lm.nomor_lambung,
    lm.lat,
    lm.lng,
    lm.geofence,
    lm.status,
    lm.speed,
    lm.course,
    lm.gps_time,
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
     ST_Within(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), polygon.geom)) and lm.speed > 0
GROUP BY 
    lm.truck_id, t.typeoftruck, lm.nomor_lambung, lm.lat, lm.lng, lm.geofence, lm.status, 
    lm.speed, lm.course, lm.gps_time, polygon.geom
ORDER BY 
    lm.gps_time;

--indexing

    CREATE INDEX idx_cp_queue_assignments_exit_time ON cp_queue_assignments(exit_time);
    CREATE INDEX idx_cp_queue_assignments_lane_id ON cp_queue_assignments(lane_id);
    CREATE INDEX idx_cp_queue_assignments_truck_type ON cp_queue_assignments(truck_type);
    CREATE INDEX idx_rulesofsimpang_lane_id ON rulesofsimpang_bayah(lane_id);
    CREATE INDEX idx_trucks_id ON trucks(id);
    create index idx_job_name on logs.last_job_executed(job_name);

--logging
    create or replace function TO_DATE_IMMUTABLE(t timestamp with TIME zone)
    returns date
    as $$ 
    begin 
    	return t::date;
    end;
    $$ language plpgsql immutable;
    end;

    create table logs.app_process(
        log_id bigserial primary key,
        log_name varchar(255),
        event_type varchar(50),
        log_level varchar(10),
        detail_message text,
        metadata text,
        created_at timestamp with time zone default now()
    );
    create index idx_log_name  ON  logs.app_process(log_name);
    create index idx_detail_message  ON  logs.app_process(detail_message);
    alter table logs.app_process add column created_at_date DATE generated always as(TO_DATE_IMMUTABLE(created_at)) stored;
    alter table logs.app_process  add constraint unique_log_entry UNIQUE(log_name,detail_message,created_at_date);
    create index idx_event_type on logs.app_process(event_type);
    create index idx_log_level  on logs.app_process(log_level);

    SET rppj_app.encryption_key = 'zzi3cGtoMKRtw2gKKO5xWAINUcckv4VYLxKKcMLpE0bAaLsUaqJK/eXfpk7/odKL'; 

    create table key_settings(
        id bigserial  primary key,
        key_name varchar (255),
        key_value text,
        created_at timestamp with time zone default now(),
        auditupdate timestamp with time zone default now()
    );

    insert into key_settings(key_name,key_value) 
    values('log-data','zzi3cGtoMKRtw2gKKO5xWAINUcckv4VYLxKKcMLpE0bAaLsUaqJK/eXfpk7/odKL');

    CREATE OR REPLACE FUNCTION decrypt_aes(_input text)
    RETURNS Text AS $$
    DECLARE
        _key TEXT;
       _output text;
    BEGIN
        select key_value from key_settings where key_name='log-data' into _key;
        if _input is null then
           return null;
        end if;
        _output := pgp_sym_decrypt(decode(_input,'base64'),_key);
        RETURN _output;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION encrypt_aes(_input text)
    RETURNS Text AS $$
    DECLARE
        _key TEXT;
       _output text;
    BEGIN
        select key_value from key_settings where key_name='log-data' into _key;
        if _input is null then
           return null;
        end if;
        _output := encode(pgp_sym_encrypt(_input, _key),'base64');
        RETURN _output;
    END;
    $$ LANGUAGE plpgsql;

    create or replace function encrypt_log_app_process_trigger()
    returns trigger as $$
    declare 
    	_key text;
    begin
    	 new.detail_message=encrypt_aes(new.detail_message);
    	 new.metadata=encrypt_aes(new.metadata);
         new.created_at_date=TO_DATE_IMMUTABLE(now()); 
    	 return new;
    end;
    $$ language plpgsql;

    create trigger trg_app_process before insert or update 
    on logs.app_process for each row execute function encrypt_log_app_process_trigger();

	create extension if not exists pg_trgm;
    create index idx_geofences_name on geofences using gin(name gin_trgm_ops);
    --Setting Every minutes
    insert into cron_schedule(cron_name,schedule,is_active) values('ApiGetMonitoringSimpangBayah',' * * * * *',true);
   
-- Manajemen Truck
create type queue_status_enum_new as enum('WAITING','ASSIGNED_TO_CP','ARRIVED','COMPLETED');
alter table cp_queue_assignments add column  temp_status varchar(100);
update cp_queue_assignments set temp_status=status::text;
update cp_queue_assignments set temp_status='ASSIGNED_TO_CP' where status::text='COMPLETED';
alter table cp_queue_assignments drop status cascade;
alter table cp_queue_assignments add column  status queue_status_enum_new;
update cp_queue_assignments set status=temp_status::queue_status_enum_new;
alter table cp_queue_assignments drop column temp_status; 

create view mv_simpang_bayah as 
WITH simpang_bayah_polygon AS (
    select ST_GeomFromText(st_astext(area),4326) geom from geofences g where g.name ilike'%simpang%bayah%' limit 1
)
SELECT 
    lm.truck_id,
    t.typeoftruck,      
    lm.nomor_lambung,
    lm.lat,
    lm.lng,
    lm.geofence,
    lm.status,
    lm.speed,
    lm.course,
    lm.gps_time,
    CASE
        WHEN ST_Within(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), polygon.geom) THEN 'In Simpang Bayah'
        ELSE 'Before Simpang Bayah'
    END AS area,
   
    round(MIN(ST_DistanceSphere(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), ST_SetSRID(ST_MakePoint(lm2.lng, lm2.lat), 4326)))::numeric,2) AS closest_vehicle_distance
FROM 
    last_truck_movement lm
JOIN 
    trucks t 
ON 
    t.id = lm.truck_id
CROSS JOIN 
    simpang_bayah_polygon AS polygon
 
JOIN 
    last_truck_movement lm2 
ON 
    lm.truck_id != lm2.truck_id  -- Menghindari membandingkan kendaraan dengan dirinya sendiri
WHERE 
    -- Berada dalam radius 1 km dari pusat koordinat atau berada dalam poligon area Simpang Bayah
    (ST_DistanceSphere(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), ST_SetSRID(ST_MakePoint(115.6427, -3.7381), 4326)) <= 1000
     OR
     ST_Within(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), polygon.geom))  and lm.speed > 0
GROUP BY 
    lm.truck_id, t.typeoftruck, lm.nomor_lambung, lm.lat, lm.lng, lm.geofence, lm.status, 
    lm.speed, lm.course, lm.gps_time, polygon.geom
ORDER BY 
    lm.gps_time;


create or replace function getNameOfUsers(_input bigint)
returns varchar as 
$$
declare 
   _result varchar;
begin
	select name into _result from users where id=_input;
	if _result is null then 
	  return '';
	end if;
    return _result;
end;	
$$ language plpgsql;

create or replace function getStatusUnit(_input bigint)
returns varchar as 
$$
declare 
   _result varchar;
   _is_simpang_bayah boolean;
begin
	select case when lane_id is not null and exit_time is null then  'Antrian CP' 
			when cp_queue_id is not null and exit_cp_time is null then 'Diarahkan Ke CP'
			when cp_queue_id is not null and exit_cp_time is not null then 'Tiba Di CP'
			else null  end into _result
	from cp_queue_assignments a  where truck_id=_input and a.assignment_id=(select assignment_id from cp_queue_assignments where truck_id = _input 
    order by auditupdate desc limit 1) ;
	if _result is null then 
		 select exists(select 1 from mv_simpang_bayah where truck_id=_input) into  _is_simpang_bayah;
		 if   (_is_simpang_bayah=true) then
		 	_result='Simpang Bayah';
		 else
		  select geofence into _result from last_truck_movement where truck_id= _input;    
		 end if;
	end if;
    return _result;
end;	
$$ language plpgsql;

create or replace function getLastUpdate_cp_qa(_input bigint)
returns timestamp with time zone as 
$$
declare 
   _result varchar;
begin
	select auditupdate into _result from cp_queue_assignments where truck_id=_input order by auditupdate desc limit 1;
	if _result is null then 
	  return null ;
	end if;
    return _result;
end;	
$$ language plpgsql;

create or replace function getFirstWord(_input text)
returns text as 
$$
declare 
   _result varchar;
begin 
	if _input is null then
		_result='';
	end if;
	select string_agg(left(word,1),'') into _result from regexp_split_to_table(_input,'\s+') as word ;
    return _result;
end;	
$$ language plpgsql;

drop materialized view if exists mv_truct_management;
create materialized view mv_truct_management as 
select ltm.*,getFirstWord(t.typeoftruck) typeoftruck, getStatusUnit(truck_id) status_unit,
coalesce((select case when created_by is null and updated_by is null  then 'System' 
when (updated_by is not null and created_by is null) then  getNameOfUsers(updated_by) 
when (created_by is not null and updated_by is null)   then   getNameOfUsers(created_by) 
when (created_by is not null and updated_by is not NULL)   then   getNameOfUsers(updated_by) 
else 'Unassigned' end
from cp_queue_assignments cqa where cqa.truck_id=ltm.truck_id  order by auditupdate desc  limit 1 ),'')  assigned,getLastUpdate_cp_qa(truck_id) auditupdate
from last_truck_movement ltm, trucks t where ltm.truck_id=t.id;



drop table if exists logs.truck_history_cp;
create table logs.truck_history_cp(
 history_id bigint primary key,
 assignment_id bigint,
 truck_id bigint,
 status varchar(50),
 description text,
 created_at timestamp with time zone,
 created_at_to_date date
 );

create table cctv_device_items(
item_id varchar(100) primary key,
item_name varchar(255) null,
device_id varchar(100) null,
device_name varchar(255) null,
cp_name varchar(20)
)
insert into cron_schedule (cron_name,schedule,is_active) values('RefreshMaterializedView','*/1 * * * * ',true);


