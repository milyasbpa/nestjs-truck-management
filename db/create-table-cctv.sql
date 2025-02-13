CREATE TYPE public.cctv_status_enum AS ENUM (
	'ACTIVE',
	'NOT ACTIVE',
	'MAINTENANCE');


ALTER TYPE public.cctv_status_enum OWNER TO dev_rppj;

CREATE TABLE public.cctv (
                             id serial4 NOT NULL,
                             cctv_id varchar(100) NULL,
                             cctv_name varchar(255) NULL,
                             location_cctv text NULL,
                             geo_location jsonb NULL,
                             status public.cctv_status_enum NOT NULL DEFAULT 'ACTIVE'::cctv_status_enum,
                             url_stream varchar(255) NULL,
                             installation_date date NULL,
                             description text NULL,
                             createdat timestamptz NOT NULL DEFAULT now(),
                             auditupdate timestamptz NOT NULL DEFAULT now(),
                             CONSTRAINT "PK_2e1326ce17db2e2a128a29a8bee" PRIMARY KEY (id),
                             CONSTRAINT "UQ_0fffa07e66cf1280e8ddac68007" UNIQUE (cctv_name),
                             CONSTRAINT "UQ_a8a9f689b816664cf282d846a0d" UNIQUE (cctv_id)
);

ALTER TABLE cctv OWNER TO dev_rppj;

INSERT INTO public.cctv (cctv_id,cctv_name,location_cctv,geo_location,status,url_stream,installation_date,description,createdat,auditupdate) VALUES
                                                                                                                                                 (NULL,'LANE 1',NULL,NULL,'ACTIVE','172.20.22.79:8889/RPPJ-GATE-3-LINE-1',NULL,'LANE 1','2025-01-14 16:22:27.876311+07','2025-01-14 16:22:27.876311+07'),
                                                                                                                                                 (NULL,'LANE 2',NULL,NULL,'ACTIVE','172.20.22.79:8889/RPPJ-GATE-3-LINE-2',NULL,'LANE 2','2025-01-14 16:22:27.876311+07','2025-01-14 16:22:27.876311+07'),
                                                                                                                                                 (NULL,'LANE 3',NULL,NULL,'ACTIVE','172.20.22.79:8889/RPPJ-GATE-3-LINE-3',NULL,'LANE 3','2025-01-14 16:22:27.876311+07','2025-01-14 16:22:27.876311+07'),
                                                                                                                                                 (NULL,'LANE 4',NULL,NULL,'ACTIVE','172.20.22.79:8889/RPPJ-GATE-3-LINE-4',NULL,'LANE 4','2025-01-14 16:22:27.876311+07','2025-01-14 16:22:27.876311+07');
