CREATE TABLE public.cp_geofence(
    geofence_id integer not null,
    geofence_name varchar(255) not null,
    cp_id integer not null,
	cp_name varchar(255) not null
);

ALTER TABLE public.cps
DROP COLUMN geofence_id;