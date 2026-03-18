-- Migrate existing deal stages to new pipeline stages
UPDATE public.clients SET deal_stage = 'Lead demonstrou interesse'  WHERE deal_stage = 'Prospecção';
UPDATE public.clients SET deal_stage = 'Reunião Introdução'          WHERE deal_stage = 'Qualificação';
UPDATE public.clients SET deal_stage = 'Proposta comercial'          WHERE deal_stage = 'Proposta Enviada';
UPDATE public.clients SET deal_stage = 'Contrato'                    WHERE deal_stage = 'Negociação';
UPDATE public.clients SET deal_stage = 'Go-Live e Implantação'       WHERE deal_stage = 'Fechado - Ganho';
UPDATE public.clients SET deal_stage = 'Lead demonstrou interesse'   WHERE deal_stage = 'Fechado - Perdido';

-- Update default value for new rows
ALTER TABLE public.clients ALTER COLUMN deal_stage SET DEFAULT 'Lead demonstrou interesse';
