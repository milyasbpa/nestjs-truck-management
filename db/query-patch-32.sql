CREATE TABLE public.cp_logs
(
    cp_log_id bigserial NOT NULL,
    cp_id bigint,
    action character varying(150),
    reason character varying(250),
    created_at timestamp with time zone,
    PRIMARY KEY (cp_log_id),
    CONSTRAINT fk_cp_id_cps FOREIGN KEY (cp_id)
        REFERENCES public.cps (cp_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
        NOT VALID
);
