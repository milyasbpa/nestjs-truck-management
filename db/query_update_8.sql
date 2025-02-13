-- cp_entrance_type
CREATE TABLE public.cp_entrance_type(
    id bigserial not null,
    type varchar(255) not null,
	CONSTRAINT cp_detail_entrance_type_key PRIMARY KEY (id)
);

-- cp_exit_type
CREATE TABLE public.cp_exit_type(
    id bigserial not null,
    type varchar(255) not null,
	CONSTRAINT cp_detail_exit_type_key PRIMARY KEY (id)
);

-- cp_detail_geofence
CREATE TABLE public.cp_detail_geofence(
	id bigserial not null,
	cp_id int4,
	description varchar,
	geofence_id int8 not null,
	geofence_name varchar not null,
	CONSTRAINT cp_detail_geofence_key PRIMARY KEY (id)
);