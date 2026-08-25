-- 1. Criação da tabela de perfis (profiles) que estende os usuários autenticados
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    main_character TEXT NOT NULL,
    ts3_nickname TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Permissões
-- Desabilitamos o RLS por enquanto para o frontend conseguir inserir os cadastros usando a Anon Key
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Se precisar ativar RLS no futuro, usaremos estas políticas:
-- CREATE POLICY "Usuários podem ver o próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Admins podem ver todos" ON public.profiles FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 3. Criação da tabela de configurações (Para ligar/desligar abas)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY,
    visible_tabs JSONB DEFAULT '["live", "planilha", "radar", "roster", "tracker", "extreme", "analytics", "bank", "market", "loot", "contribute"]'::jsonb
);

-- Insere a configuração padrão se não existir
INSERT INTO public.app_settings (id, visible_tabs) 
VALUES (1, '["live", "planilha", "radar", "roster", "tracker", "extreme", "analytics", "bank", "market", "loot", "contribute"]'::jsonb) 
ON CONFLICT (id) DO NOTHING;

-- Desabilita RLS para leitura/escrita fácil pelo front
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

