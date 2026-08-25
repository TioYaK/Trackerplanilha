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

-- 3. Atualizar o seu usuário para admin (Opcional, você pode fazer isso depois pelo site quando criarmos o painel)
