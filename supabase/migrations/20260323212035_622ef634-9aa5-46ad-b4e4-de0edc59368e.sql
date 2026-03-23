
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON public.access_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon read" ON public.access_logs FOR SELECT TO anon, authenticated USING (true);
