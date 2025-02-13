ALTER TABLE public.vidiotron_notif ADD vidiotron_id int8 NULL;
ALTER TABLE vidiotron_notif OWNER TO dev_rppj;

CREATE TABLE public.vidiotron (
        id serial4 NOT NULL,
        "code" varchar NULL,
        description varchar NULL,
        ip varchar NULL,
        status bool NULL DEFAULT true,
        CONSTRAINT "PK_fa43199c574102ee63b0bccc054" PRIMARY KEY (id)
);

ALTER TABLE vidiotron OWNER TO dev_rppj;

CREATE TABLE public.vidiotron_lane (
        vidiotron_id int8 NOT NULL,
        lane_id int8 NOT NULL
);

ALTER TABLE vidiotron_lane OWNER TO dev_rppj;

CREATE TABLE public.vidiotron_cp (
    vidiotron_id int8 NOT NULL,
    cp_id int8 NOT NULL
);

ALTER TABLE vidiotron_cp OWNER TO dev_rppj;

INSERT INTO public.cron_schedule (
    cron_name,
    schedule,
    is_active
) VALUES
    ('ApiGetLuminix', '*/20 * * * * *', true);
