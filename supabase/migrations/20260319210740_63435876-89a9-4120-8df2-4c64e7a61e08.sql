
CREATE TABLE public.authorized_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.authorized_emails
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.authorized_emails (email) VALUES ('francisco@scalacapital.com.br');
