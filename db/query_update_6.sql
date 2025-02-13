CREATE TYPE public.role_name_enum AS ENUM ('ADMIN', 'USER');

ALTER TABLE public.users ADD role_name public.role_name_enum NULL;
