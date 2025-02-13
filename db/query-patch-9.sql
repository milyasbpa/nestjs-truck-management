CREATE INDEX idx_cps_status
ON cps (status);
ALTER TABLE public.cps OWNER TO dev_rppj;

CREATE INDEX idx_cp_queue_assignments_cp_queue_id_exit_status
ON cp_queue_assignments (cp_queue_id, exit_time, status);
ALTER TABLE public.cp_queue_assignments OWNER TO dev_rppj;

CREATE INDEX idx_nomor_lambung_trgm ON trucks USING gin (nomor_lambung gin_trgm_ops);
ALTER TABLE public.trucks OWNER TO dev_rppj;
