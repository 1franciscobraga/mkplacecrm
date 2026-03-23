
-- Add status and invited_at columns to authorized_emails
ALTER TABLE public.authorized_emails 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS added_by text;

-- Allow authenticated users to insert, update, delete (for admin management)
CREATE POLICY "Allow authenticated insert" ON public.authorized_emails
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.authorized_emails
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON public.authorized_emails
  FOR DELETE TO authenticated USING (true);
