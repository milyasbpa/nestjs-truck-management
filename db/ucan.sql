-- Create the sequence for the id column
CREATE SEQUENCE IF NOT EXISTS ucan_id_seq;

-- Create the trucks table (if it doesn't already exist)
-- This is required since nomor_lambung in the ucan table references it
CREATE TABLE IF NOT EXISTS "public"."trucks" (
    "nomor_lambung" varchar(50) PRIMARY KEY
);

-- Create the ucan table
CREATE TABLE "public"."ucan" (
    "id" int4 NOT NULL DEFAULT nextval('ucan_id_seq'::regclass),
    "nomor_lambung" varchar(50) NOT NULL,
    "closing_ritase_timestamp" timestamp NOT NULL,
    "net_weight" numeric(10,2) NOT NULL,
    "tare_weight" numeric(10,2) NOT NULL,
    "gross_weight" numeric(10,2) NOT NULL,
    CONSTRAINT "ucan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_nomor_lambung" FOREIGN KEY ("nomor_lambung") REFERENCES "public"."trucks"("nomor_lambung") ON DELETE CASCADE
);

ALTER TABLE "public"."trucks" ADD CONSTRAINT trucks_nomor_lambung_unique UNIQUE ("nomor_lambung");

