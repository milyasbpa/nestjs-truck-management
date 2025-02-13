ALTER TABLE rfid_transaction
ADD COLUMN device_id character varying(255);


CREATE SEQUENCE IF NOT EXISTS public.cp_detail_cp_detail_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.cp_detail
(
    cp_detail_id bigint NOT NULL DEFAULT nextval('cp_detail_cp_detail_id_seq'::regclass),
    cp_id integer,
    "desc" character varying COLLATE pg_catalog."default",
    device_id character varying COLLATE pg_catalog."default",
    CONSTRAINT cp_detail_pkey PRIMARY KEY (cp_detail_id)
)

ALTER TABLE rfid_reader_in
ADD COLUMN device_id character varying(255),
ADD COLUMN cp_detail_id integer varying(255);

ALTER TABLE rfid_reader_out
ADD COLUMN device_id character varying(255),
ADD COLUMN cp_detail_id integer varying(255);

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(6, 3, 'IN', 'BNT-CP1_3IN-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(7, 1, 'IN', 'BNT-CP1_3IN-RFID01');


INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(8, 1, 'OUT', 'BNT-CP1OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(9, 3, 'OUT', 'BNT-CP3OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(10, 10, 'IN', 'BNT-CP2IN-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(11, 10, 'OUT', 'BNT-CP2OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(12, 2, 'OUT', 'BNT-CP2A_OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(13, 11, 'OUT', 'BNT-CP2B_OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(14, 2, 'IN', 'BNT-CP2A_B_IN-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(15, 11, 'IN', 'BNT-CP2A_B_IN-RFID01');


INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(16, 4, 'IN', 'BNT-CP4_5IN-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(17, 5, 'IN', 'BNT-CP4_5IN-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(18, 5, 'OUT', 'BNT-CP5OUT-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(19, 4, 'OUT', 'BNT-CP4OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(20, 6, 'IN', 'BNT-CP6_7IN-RFID01');
INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(21, 7, 'IN', 'BNT-CP6_7IN-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(22, 6, 'OUT', 'BNT-CP6OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(23, 7, 'OUT', 'BNT-CP7OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(24, 8, 'OUT', 'BNT-CP8OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(25, 9, 'OUT', 'BNT-CP9OUT-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(26, 9, 'IN', 'BNT-CP8_9IN-RFID01');

INSERT INTO public.cp_detail
(cp_detail_id, cp_id, "desc", device_id)
VALUES(27, 8, 'IN', 'BNT-CP8_9IN-RFID01');





