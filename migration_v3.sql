-- ==========================================
-- SCRIPT DE MIGRAÇÃO PARTE 3 — CineList
-- Criação da tabela de curtidas em avaliações (review_likes)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================

-- Criar tabela de curtidas
CREATE TABLE IF NOT EXISTS public.review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(review_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir leitura pública de curtidas" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Permitir curtidas para usuários autenticados" ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir remover a própria curtida" ON public.review_likes FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_likes_review_id ON public.review_likes(review_id);
