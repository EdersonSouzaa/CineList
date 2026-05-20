-- ==========================================
-- SCRIPT DE SCHEMA PARA O APLICATIVO CINELIST
-- Versão 2.0 — Integração com TMDB (movie_id agora é TEXT)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================

-- ──────────────────────────────────────────
-- Se você já executou o schema anterior (v1),
-- rode PRIMEIRO o script de migração: migration_v2.sql
-- ──────────────────────────────────────────

-- 1. Tabela de Avaliações e Comentários (reviews)
-- movie_id é TEXT no formato "movie_123" ou "tv_456" (ID do TMDB)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS na tabela de avaliações
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de avaliações"
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de avaliações para usuários autenticados"
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir alteração da própria avaliação"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir exclusão da própria avaliação"
ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Índice para buscas por filme
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON public.reviews(movie_id);


-- 2. Tabela de Favoritos (favorites)
-- movie_id é TEXT no formato "movie_123" ou "tv_456" (ID do TMDB)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(movie_id, user_id)
);

-- Habilitar RLS na tabela de favoritos
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de favoritos do próprio usuário"
ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção de favoritos para si mesmo"
ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir exclusão dos próprios favoritos"
ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Índice para buscas por usuário
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
