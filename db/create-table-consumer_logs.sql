CREATE TABLE public.consumer_logs (
    id serial4 NOT NULL,
    topic_name varchar(255) NULL,
    payload text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "PK_fa43199c574102ee63b0bc45s42" PRIMARY KEY (id)
);
ALTER TABLE public.consumer_logs OWNER TO dev_rppj;