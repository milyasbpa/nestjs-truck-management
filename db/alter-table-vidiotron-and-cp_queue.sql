-- Add is_dynamic column to vidiotron table
ALTER TABLE public.vidiotron 
ADD is_dynamic bool NULL DEFAULT true;

-- Create table for rules mapping lanes to CP queues
CREATE TABLE public.rule_lane_cp_queues (
    id serial4 NOT NULL,
    queue_lane_id int4 NOT NULL,
    name_queue_lane varchar(255) NOT NULL,
    cp_queue_id int4 NULL,
    created_by int4 NULL,
    updated_by int4 NULL,
    created_at timestamp NULL,
    auditupdate timestamp NULL,
    cp_queue_name varchar(20) NULL,
    CONSTRAINT rule_lane_cp_queues_pkey PRIMARY KEY (id)
);
ALTER TABLE public.rule_lane_cp_queues OWNER TO dev_rppj;

-- Add new queue status enum value
ALTER TYPE queue_status_enum_new 
ADD VALUE 'ASSIGNED_TO_CP_QUEUE';