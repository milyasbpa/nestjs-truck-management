CREATE TABLE public.cp_entrance_detail (
	id bigserial not null,
	cp_id int4 not null,
	cp_entrance_id int4 not null,
	cp_entrance_type_name varchar(255) not null,
	CONSTRAINT cp_entrance_detail_key PRIMARY KEY (id)
);
CREATE TABLE public.cp_exit_detail (
	id bigserial NOT NULL,
	cp_id int4 NULL,
	cp_exit_id int4 not null,
	cp_exit_type_name varchar(255) not null,
	CONSTRAINT cp_exit_detail_key PRIMARY KEY (id)
);