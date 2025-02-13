ALTER TABLE public.lanes ADD deleted_at timestamptz NULL;
ALTER TABLE public.lanes ADD deleted_by varchar NULL;
