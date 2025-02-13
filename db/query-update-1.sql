INSERT INTO public.cron_schedule
(id, cron_name, schedule, is_active, created_at, auditupdate, changes_by)
VALUES(96, 'ApiCheckCOPStatus', '*/1 * * * *', true, NOW(), NOW(), NULL);
CREATE TYPE public.completed_by_enum AS ENUM ('GEOFENCE', 'UCAN', 'RFID');
ALTER TABLE public.cp_queue_assignments ADD completed_by public.completed_by_enum NULL;