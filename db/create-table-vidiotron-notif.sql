CREATE TABLE public.vidiotron_notif (
    vidiotron_notif_id serial4 NOT NULL,
    "header" varchar NULL,
    body_description varchar NULL,
    total_description varchar NULL,
    type_truck_description varchar NULL,
    lane_id int8 NULL,
    cp_id int8 NULL,
    status bool NULL,
    created_by int4 NULL,
    updated_by varchar NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    auditupdate timestamptz NOT NULL DEFAULT now(),
    notif_type varchar NOT NULL,
    command json NULL,
    CONSTRAINT "PK_fa43199c574102ee63b0bccc579" PRIMARY KEY (vidiotron_notif_id)
);

ALTER TABLE public.vidiotron_notif OWNER TO postgres;
