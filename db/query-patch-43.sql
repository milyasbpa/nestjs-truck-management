CREATE SEQUENCE rfid_cp_queue_id_seq START 1;

CREATE TABLE IF NOT EXISTS public.rfid_cp_queue
(
    id bigint NOT NULL DEFAULT nextval('rfid_cp_queue_id_seq'::regclass),
    lane_id bigint,
    created_at timestamp with time zone,
    CONSTRAINT rfid_cp_queue_pkey PRIMARY KEY (id)
)

ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD COLUMN truck_id integer;

ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD COLUMN device_id character varying;

ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD COLUMN status character varying;

ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD COLUMN rfid_tag character varying;

ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD COLUMN is_valid boolean;
ALTER TABLE IF EXISTS public.rfid_cp_queue
    ADD CONSTRAINT fk_truck_id_cp_queue FOREIGN KEY (truck_id)
    REFERENCES public.trucks (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE SET NULL
    NOT VALID;