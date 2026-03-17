
CREATE TABLE public.clients (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_name TEXT,
  meeting_date TEXT,
  business_model TEXT,
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_group TEXT,
  executive_summary TEXT,
  pain_points_and_challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals_and_expectations JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_differentials JSONB NOT NULL DEFAULT '[]'::jsonb,
  deal_value TEXT,
  revenue_model TEXT,
  client_timeline TEXT,
  budget_mentioned TEXT,
  tech_stack TEXT,
  implementation_complexity TEXT,
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsible_parties TEXT,
  next_contact_date TEXT,
  deal_stage TEXT NOT NULL DEFAULT 'Prospecção',
  confidence_level INTEGER,
  urgency TEXT,
  risk TEXT,
  expansion_potential TEXT,
  price_sensitivity TEXT,
  assigned_to TEXT NOT NULL DEFAULT 'Você',
  meetings JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required - shared CRM)
CREATE POLICY "Allow public read" ON public.clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.clients FOR DELETE TO anon, authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

-- Seed clients from reference data
INSERT INTO public.clients (id, client_name, project_name, business_model, contact_name, company_group, executive_summary, deal_value, revenue_model, client_timeline, deal_stage, confidence_level, urgency, risk, expansion_potential, price_sensitivity, assigned_to, pain_points_and_challenges, goals_and_expectations, client_differentials, next_steps) VALUES
('client-b3', 'B3 - Brasil Bolsa Balcão', 'Marketplace B3', 'Marketplace White Label B2B', 'Scala Capital', 'B3 S.A.', 'Brazilian Stock Exchange - plataforma de marketplace para o ecossistema financeiro.', 'R$ 300k setup + R$ 1M RR + 1,8% TR', 'Setup + Recurring Revenue + Take-rate sobre GMV', 'Jun 2026', 'Negociação', 85, 'Alta', 'Baixa', 'Alto', 'Baixa', 'Scala Capital', '[]'::jsonb, '["GMV esperado de R$ 80M no 1º ano"]'::jsonb, '["Bolsa de valores brasileira", "Infraestrutura financeira robusta"]'::jsonb, '["Finalizar contrato"]'::jsonb),

('client-smzto', 'SMZTO', 'Marketplace Franquias', 'Marketplace White Label B2B', 'Scala Capital', 'SMZTO S.A.', 'Maior rede de franquias do Brasil com 18 marcas e 5.000 lojas.', 'R$ 160k setup + R$ 1,5M RR + 3,1% TR', 'Setup + Recurring Revenue + Take-rate sobre GMV', 'Mai 2026', 'Negociação', 85, 'Alta', 'Baixa', 'Alto', 'Média', 'Scala Capital', '[]'::jsonb, '["GMV esperado de R$ 30M no 1º ano"]'::jsonb, '["18 marcas", "5.000 lojas", "Maior rede de franquias do Brasil"]'::jsonb, '["Finalizar contrato"]'::jsonb),

('client-picpay', 'PicPay', 'Marketplace PicPay', 'Fintech Marketplace', 'Scala Capital', 'PicPay S.A.', '2º maior banco digital da América Latina com 66M de clientes.', 'R$ 0 setup + R$ 1,2M RR + 2,5% TR', 'Recurring Revenue + Take-rate sobre GMV', 'Mar 2026', 'Fechado - Ganho', 90, 'Alta', 'Baixa', 'Alto', 'Baixa', 'Scala Capital', '[]'::jsonb, '["GMV esperado de R$ 300M no 1º ano"]'::jsonb, '["66M de clientes", "2º maior banco digital Latam"]'::jsonb, '["Docusign em andamento"]'::jsonb),

('client-ifood', 'iFood', 'Marketplace iFood', 'Marketplace Delivery', 'Vlad', 'iFood S.A.', 'Maior plataforma de delivery da América Latina com 60M de clientes.', 'R$ 0 setup + R$ 600k RR + 2,5% TR', 'Recurring Revenue + Take-rate sobre GMV', 'Jul 2026', 'Fechado - Ganho', 80, 'Média', 'Média', 'Alto', 'Média', 'Vlad', '[]'::jsonb, '["GMV esperado de R$ 150M no 1º ano"]'::jsonb, '["60M de clientes", "Maior delivery Latam"]'::jsonb, '["Integração em andamento"]'::jsonb),

('client-allu', 'Allu', 'Marketplace Allu', 'Marketplace Assinatura', 'Scala Capital', 'Allu S.A.', 'Maior empresa de aluguel de iPhones do Brasil.', 'R$ 75k setup + R$ 1M RR + 7% TR', 'Setup + Recurring Revenue + Take-rate sobre GMV', 'Mai 2026', 'Negociação', 80, 'Alta', 'Baixa', 'Médio', 'Média', 'Scala Capital', '[]'::jsonb, '["GMV esperado de R$ 10M no 1º ano"]'::jsonb, '["Maior empresa de aluguel de iPhones do Brasil"]'::jsonb, '["Finalizar contrato"]'::jsonb),

('client-familhao', 'Familhão', 'Marketplace Familhão', 'Clube de Benefícios / Loyalty', 'Vlad', NULL, 'Clube de benefícios e fidelidade com 10M de usuários. POC aprovado, em fase de contratos finais.', NULL, NULL, NULL, 'Negociação', 75, 'Média', 'Média', 'Alto', 'Média', 'Vlad', '[]'::jsonb, '[]'::jsonb, '["10M de usuários ativos", "Clube de benefícios consolidado"]'::jsonb, '["Finalizar contratos"]'::jsonb),

('client-tplink', 'TP-Link', 'Marketplace TP-Link', 'Varejo Hardware / Smart Home', 'Vlad', 'TP-Link Corporation', 'Empresa global de networking e varejo de hardware smart-home.', NULL, NULL, NULL, 'Negociação', 70, 'Média', 'Média', 'Médio', 'Média', 'Vlad', '[]'::jsonb, '[]'::jsonb, '["Marca global", "Presença em varejo de smart-home"]'::jsonb, '["Finalizar contrato"]'::jsonb),

('client-anima', 'Ânima Educação', 'Marketplace Cursos Digitais', 'EdTech Marketplace', 'Vlad', 'Ânima Holding', 'Um dos maiores grupos privados de ensino superior do Brasil. Busca vender cursos digitais via marketplace.', NULL, NULL, NULL, 'Negociação', 70, 'Média', 'Média', 'Alto', 'Média', 'Vlad', '[]'::jsonb, '["Vender cursos digitais via marketplace"]'::jsonb, '["Um dos maiores grupos de ensino superior privado"]'::jsonb, '["Finalizar contrato"]'::jsonb);
