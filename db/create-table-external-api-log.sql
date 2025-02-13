CREATE TABLE public.external_api_log (
    id          serial4       NOT NULL,
    "host"      varchar(255)  NULL,
    "url"       varchar(255)  NULL,
    "header"    varchar(255)  NULL,
    "request"   text         NULL,
    response    text         NULL,
    status_code int          NULL,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT "PK_fa43199c574102ee63kdjd830fj" PRIMARY KEY (id)
);

ALTER TABLE public.external_api_log OWNER TO dev_rppj;