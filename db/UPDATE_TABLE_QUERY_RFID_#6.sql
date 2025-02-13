CREATE TABLE IF NOT EXISTS public.rfid_transaction_archive (id SERIAL PRIMARY KEY, rfid_transaction_id integer NOT NULL, cp_assignment_id bigint, truck_id bigint, event_type rfid_transaction_event_type_enum NOT NULL DEFAULT 'IN'::rfid_transaction_event_type_enum, rfid_reader_in_id bigint, rfid_reader_out_id bigint, is_valid boolean NOT NULL DEFAULT true, created_by integer, updated_by character varying COLLATE pg_catalog."default", created_at timestamp with time zone NOT NULL DEFAULT now(), auditupdate timestamp with time zone NOT NULL DEFAULT now(), rfid_transaction_date timestamp with time zone, device_id character varying COLLATE pg_catalog."default", cp_id integer, is_valid_rfid boolean, deleted_at timestamp with time zone);


ALTER TABLE IF EXISTS public.rfid_transaction
    ADD COLUMN driver_name character varying;
