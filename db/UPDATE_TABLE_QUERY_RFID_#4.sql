ALTER TABLE public.rfid_reader_in ADD photo_url varchar NULL;
ALTER TABLE public.rfid_reader_out ADD photo_url varchar NULL;

CREATE TABLE public.rfid_threshold
(
    rfid_threshold_id bigserial NOT NULL,
    min_threshold_in_hours integer,
    max_threshold_in_hours integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    PRIMARY KEY (rfid_threshold_id)
);

ALTER TABLE public.rfid_transaction ADD deleted_at timestamp with time zone NULL;

ALTER TABLE public.rfid_threshold ADD description VARCHAR NULL;

CREATE TABLE public.rfid_anomaly
(
    id bigserial NOT NULL,
    "desc" character varying,
    type_anomaly character varying,
    rfid_transaction_id integer,
    created_at time with time zone,
    PRIMARY KEY (id)
);
