CREATE TABLE public.external_api_token (
    id           serial4      NOT NULL,
    code         varchar      NOT NULL,
    auth_token   text         NOT NULL,
    expired_at   timestamptz  NULL,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    auditupdate  timestamptz  NOT NULL DEFAULT now(),
    host         varchar      NOT NULL,
    CONSTRAINT "PK_fa43199c574102ee645415s5054" PRIMARY KEY (id),
    CONSTRAINT "UQ_code_host" UNIQUE (code, host)
);

ALTER TABLE public.external_api_token OWNER TO dev_rppj;

insert into cron_schedule(cron_name,schedule,is_active) values('ApiGenerateExternalToken','0 * * * *',true);

INSERT INTO public.external_api_token (code,auth_token,expired_at,created_at,auditupdate,host) VALUES
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-rppj-line-06.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-spbayah-01.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-spbayah-02.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-spbayah-03.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-spbayah-04.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-rppj-line-01.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-rppj-line-02.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-rppj-line-03.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTM3LCJleHAiOjE3MzU0NDU5Mzd9.7-9Bb-PzsBmfrZ3oVnQfUDxyZOHdZL49Ltyxqgrb54w',NULL,'2024-12-28 11:21:04.035136+07','2024-12-28 11:21:04.035136+07','https://vtron-rppj-line-04.borneoindobara.com'),
    ('VIDIOTRON','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbnZtcyIsInJvbGUiOiJzdXBlckFkbWluIiwiaWF0IjoxNzM1MzU5NTQyLCJleHAiOjE3MzU0NDU5NDJ9.xwcMezm-lFmsMZuQL6ebHu_CSBGmP0qKXkXbvuZ-vA0',NULL,'2024-12-28 11:21:12.736449+07','2024-12-28 11:21:12.736449+07','https://vtron-rppj-line-05.borneoindobara.com');












