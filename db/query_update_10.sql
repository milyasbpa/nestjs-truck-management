CREATE TYPE public.lanes_activity_log_status_enum AS ENUM ('OPERATIONAL', 'NON_OPERATIONAL','DELETED');

CREATE TABLE public.lanes_activity_log (
	id bigserial not null,
    lane_id bigserial not null,
	previous_lane_name varchar(255) null,
	current_lane_name varchar(255) null,
	previous_status public.lanes_activity_log_status_enum null,
	current_status public.lanes_activity_log_status_enum null,
	previous_positioning int4 null,
	current_positioning int4 null,
	reason varchar(255) null,
	auditupdate timestamptz default now() null,
	updated_by varchar(255) null
);