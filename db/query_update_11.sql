CREATE TABLE public.rule_lane_queue_lane (
    id serial4 NOT NULL,
    lane_id int4 NOT NULL,
    lane_name varchar(255) NOT NULL,
    queue_lane_id int4 NULL,
    queue_lane_name varchar(255) NOT NULL,
    created_by int4 NULL,
    updated_by int4 NULL,
    created_at timestamp NULL,
    auditupdate timestamp NULL,
    CONSTRAINT rule_lane_queue_lane_pkey PRIMARY KEY (id)
);

CREATE TYPE public.queue_lanes_activity_log_status_enum AS ENUM ('OPERATIONAL', 'NON_OPERATIONAL','DELETED');

CREATE TABLE public.queue_lanes_activity_log (
    id bigserial NOT NULL,
    queue_lane_id bigserial NOT NULL,
    previous_queue_lane_name varchar(255) NULL,
    current_queue_lane_name varchar(255) NULL,
    previous_status public."queue_lanes_activity_log_status_enum" NULL,
    current_status public."queue_lanes_activity_log_status_enum" NULL,
    previous_positioning int4 NULL,
    current_positioning int4 NULL,
    reason varchar(255) NULL,
    auditupdate timestamptz DEFAULT now() NULL,
    updated_by varchar(255) NULL
);