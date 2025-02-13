CREATE TABLE public.ringtone (
	id serial4 NOT NULL,
	code varchar(100) NULL,
	description varchar(255) NULL,
	url varchar(255) NULL,
	updated_by int null,
	created_by int null,
	created_at timestamptz NOT NULL DEFAULT now(),
	auditupdate timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "PK_ringtone" PRIMARY KEY (id),
	CONSTRAINT "UQ_ringtone_code" UNIQUE (code)
);

ALTER TABLE public.ringtone OWNER TO dev_rppj;

CREATE TABLE public.text_to_speech_config (
	id serial4 NOT NULL,
	code varchar(100) NULL,
	description varchar(255) NULL,
	text_speech varchar(255) NULL,
	updated_by int null,
	created_by int null,
	created_at timestamptz NOT NULL DEFAULT now(),
	auditupdate timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "PK_text_to_speech_config" PRIMARY KEY (id),
	CONSTRAINT "UQ_text_to_speech_config_code" UNIQUE (code)
);
ALTER TABLE public.text_to_speech_config OWNER TO dev_rppj;

CREATE TABLE public.vidiotron_command (
	id serial4 NOT NULL,
	code varchar(100) NULL,
	description varchar(255) NULL,
	command_name varchar(100) NULL,
	updated_by int4 NULL,
	created_by int4 NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	auditupdate timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "PK_vidiotron_command" PRIMARY KEY (id),
	CONSTRAINT vidiotron_command_un UNIQUE (code)
);
ALTER TABLE public.vidiotron_command OWNER TO dev_rppj;

CREATE TABLE public.vidiotron_command_detail (
	id serial4 NOT NULL,
	line_id int4 NOT NULL,
	tipe varchar(100) NOT NULL,
	"text" varchar(100) NOT NULL,
	pos_x int4 NOT NULL,
	pos_y int4 NOT NULL,
	"absolute" bool NOT NULL DEFAULT true,
	align varchar(100) NOT NULL,
	"size" int4 NOT NULL,
	color varchar(100) NOT NULL,
	speed int4 NOT NULL,
	image varchar(100) NOT NULL,
	padding int4 NOT NULL,
	line_height int4 NOT NULL,
	width int4 NOT NULL,
	font int4 NOT NULL,
	"style" varchar(100) NOT NULL,
	updated_by int4 NULL,
	created_by int4 NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	auditupdate timestamptz NOT NULL DEFAULT now(),
	vidiotron_command_id int8 NOT NULL,
	CONSTRAINT "PK_vidiotron_command_detail" PRIMARY KEY (id),
	CONSTRAINT vidiotron_command_detail_fk FOREIGN KEY (vidiotron_command_id) REFERENCES public.vidiotron_command(id) ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE public.vidiotron_command_detail OWNER TO dev_rppj;
