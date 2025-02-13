CREATE TYPE public.rfid_transaction_event_type_enum AS ENUM (
	'IN',
	'OUT');

ALTER TYPE public.rfid_transaction_event_type_enum OWNER TO postgres;

CREATE TABLE public.rfid_reader_in (
    rfid_reader_in_id serial4 NOT NULL,
    rfid_code varchar(255) NULL,
    description text NULL,
    geofence_id int4 NULL,
    status bool NOT NULL DEFAULT true,
    created_by int4 NULL,
    updated_by varchar NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    auditupdate timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_3a543ea760c0453730cf9524a32" PRIMARY KEY (rfid_reader_in_id)
);

ALTER TABLE demo.rfid_reader_in OWNER TO postgres;

CREATE TABLE public.rfid_reader_out (
  rfid_reader_out_id serial4 NOT NULL,
  rfid_code varchar(255) NULL,
  description text NULL,
  geofence_id int4 NULL,
  status bool NOT NULL DEFAULT true,
  created_by int4 NULL,
  updated_by varchar NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  auditupdate timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_65ae3c7980ad2b5fcc1df63e31e" PRIMARY KEY (rfid_reader_out_id)
);

ALTER TABLE demo.rfid_reader_out OWNER TO postgres;

CREATE TABLE public.rfid_transaction (
  rfid_transaction_id serial4 NOT NULL,
  cp_assignment_id int8 NULL,
  truck_id int8 NULL,
  event_type public.rfid_transaction_event_type_enum NOT NULL DEFAULT 'IN'::rfid_transaction_event_type_enum,
  rfid_reader_in_id int8 NULL,
  rfid_reader_out_id int8 NULL,
  is_valid bool NOT NULL DEFAULT true,
  created_by int4 NULL,
  updated_by varchar NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  auditupdate timestamptz NOT NULL DEFAULT now(),
  rfid_transaction_date timestamptz NULL,
  CONSTRAINT "PK_322d83ad4ff5bf5d3bc73cd0b01" PRIMARY KEY (rfid_transaction_id)
);

ALTER TABLE demo.rfid_transaction OWNER TO postgres;
