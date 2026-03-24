CREATE POLICY "Allow anon delete" ON public.authorized_emails FOR DELETE TO anon USING (true);
CREATE POLICY "Allow anon insert" ON public.authorized_emails FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.authorized_emails FOR UPDATE TO anon USING (true) WITH CHECK (true);