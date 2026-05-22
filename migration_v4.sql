-- ==========================================
-- SCRIPT DE MIGRAÇÃO PARTE 4 — CineList
-- Adição da coluna is_spoiler na tabela de avaliações (reviews)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT false;
