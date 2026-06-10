-- Criação da tabela de chaves de ativação
CREATE TABLE IF NOT EXISTS public.activation_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security) para garantir a segurança da tabela
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

-- Criar política permitindo que o aplicativo (usuários anônimos/públicos) 
-- possa LER (SELECT) as chaves para verificar a ativação
CREATE POLICY "Permitir leitura pública das chaves de ativação" 
ON public.activation_keys
FOR SELECT 
TO public
USING (true);

-- Criar política permitindo que o aplicativo CONSUMA a chave (UPDATE)
-- Restringe para que só possam alterar is_active para false quando for true
CREATE POLICY "Permitir consumo da chave de ativação" 
ON public.activation_keys
FOR UPDATE 
TO public
USING (is_active = true)
WITH CHECK (is_active = false);

-- ==========================================
-- (Opcional) Chaves de Exemplo para Testes
-- ==========================================
INSERT INTO public.activation_keys (key, is_active) VALUES 
('MECA-NICO-PRO1-2345', true),
('TEST-DEMO-0000-0000', true),
('CHAV-EBLO-QUEA-DA12', false)
ON CONFLICT (key) DO NOTHING;
