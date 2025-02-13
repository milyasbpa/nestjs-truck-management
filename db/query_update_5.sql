CREATE TYPE public.lane_activity_log_status_enum AS ENUM ('CREATED', 'OPERATIONAL', 'NON_OPERATIONAL','DELETED');

CREATE TYPE public.queue_lane_activity_log_enum AS ENUM ('CREATED', 'OPERATIONAL', 'NON_OPERATIONAL','DELETED');

CREATE TABLE public.lane_activity_log (
    id bigint NOT NULL,
    lane_code character varying(30) NOT NULL,
    lane_name character varying(255) NOT NULL,
    status public.lane_activity_log_status_enum
    auditupdate timestamp with time zone DEFAULT now(),
    updated_by character varying(255),
);

CREATE TABLE public.queue_lane_activity_log (
    id bigint NOT NULL,
    queue_lane_id INT NOT NULL,
    lane_name character varying(255) NOT NULL,
    status public.queue_lane_activity_log_enum
    auditupdate timestamp with time zone DEFAULT now(),
    updated_by character varying(255),
);