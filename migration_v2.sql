-- ========================================================
-- MIGRAÇÃO v1 → v2: Schema completo do CineList — Supabase
-- Execute este script no SQL Editor do Supabase
-- ========================================================

-- ── 1. TABELA USERS (perfis de usuário autenticados) ───────
-- Perfis opcionais vinculados ao Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfil público: ler outros usuários"
  ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Perfil: cada usuário gerencia o próprio perfil"
  ON public.users FOR ALL USING (auth.uid() = auth_uid);

-- ── 2. TABELA REVIEWS (avaliações e comentários) ───────────
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id    TEXT NOT NULL,          -- "movie_123" ou "tv_456" (formato TMDB)
  user_id     UUID NOT NULL,
  user_email  TEXT NOT NULL,
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de avaliações"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Inserir avaliação (apenas usuário autenticado)"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alterar própria avaliação"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Excluir própria avaliação"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ── 3. TABELA FAVORITES (biblioteca do usuário) ─────────────
DROP TABLE IF EXISTS public.favorites;

CREATE TABLE public.favorites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id   TEXT NOT NULL,          -- "movie_123" ou "tv_456"
  user_id    UUID NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(movie_id, user_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler favoritos do próprio usuário"
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Adicionar favorito (apenas o próprio usuário)"
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Remover próprio favorito"
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- ── 4. VIEW: melhor rating por filme/série ───────────────────
CREATE OR REPLACE VIEW public.movie_ratings AS
SELECT
  movie_id,
  COUNT(*)                                         AS review_count,
  ROUND(AVG(rating)::numeric, 1)                   AS average_rating,
  MAX(created_at)                                  AS last_rated_at
FROM public.reviews
GROUP BY movie_id;

GRANT SELECT ON public.movie_ratings TO PUBLIC;

-- ── 5. FUNÇÃO: criar perfil automaticamente ao cadastrar usuário ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_uid, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. COMENTÁRIOS ───────────────────────────────────────────
COMMENT ON TABLE  public.users      IS 'Perfis de usuário do CineList (1:1 com auth.users)';
COMMENT ON TABLE  public.reviews    IS 'Avaliações e comentários de filmes/séries';
COMMENT ON TABLE  public.favorites  IS 'Biblioteca de favoritos de filmes/séries por usuário';
COMMENT ON TABLE  public.movie_ratings IS 'Agregação de avaliações por item TMDB';
