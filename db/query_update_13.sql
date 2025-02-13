CREATE TABLE public.dt_count_sicantik (
	id bigserial NOT NULL,
	timestamp varchar(255) NOT NULL,
	camera varchar(255) NOT NULL,
	total_vehicles int8 NOT NULL,
	CONSTRAINT dt_count_si_cantik_key PRIMARY KEY (id)
);

ALTER TABLE public.cps ADD sicantik_code varchar NULL;
ALTER TABLE public.queue_lane ADD sicantik_code varchar NULL;
