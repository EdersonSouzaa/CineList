import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Pool do PostgreSQL usando a URL do banco (ex: fornecida pelo Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = {
  // Executa queries no PostgreSQL
  async query(text, params) {
    if (!process.env.DATABASE_URL) {
      const errMsg = 'A variável DATABASE_URL não está definida no arquivo .env. Por favor, adicione sua string de conexão PostgreSQL do Render para prosseguir.';
      console.error('❌ Erro no banco de dados:', errMsg);
      throw new Error(errMsg);
    }
    
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  },
  
  // Mantido apenas para compatibilidade (mas deve ser removido após atualizar os controllers)
  getCollection(name) {
    console.warn(`Atenção: getCollection chamada para '${name}'. Esta função está obsoleta com o PostgreSQL.`);
    return [];
  },
  saveCollection(name, collection) {
    console.warn(`Atenção: saveCollection chamada para '${name}'. Esta função está obsoleta com o PostgreSQL.`);
    return true;
  }
};

// Função para inicializar as tabelas do banco no Render/Postgres automaticamente no startup
export const initDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ AVISO: A inicialização das tabelas do banco foi pulada porque a variável DATABASE_URL não está definida no .env.');
    return;
  }
  
  const queryText = `

    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. Tabela de Usuários (users)
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    -- 2. Tabela de Avaliações e Comentários (reviews)
    CREATE TABLE IF NOT EXISTS public.reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      movie_id TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      is_spoiler BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON public.reviews(movie_id);

    -- 3. Tabela de Favoritos (favorites)
    CREATE TABLE IF NOT EXISTS public.favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      movie_id TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      UNIQUE(movie_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

    -- 4. Tabela de Curtidas em Avaliações (review_likes)
    CREATE TABLE IF NOT EXISTS public.review_likes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      UNIQUE(review_id, user_id)
    );

    -- 5. Tabela Opcional de Filmes em Cache (movies)
    CREATE TABLE IF NOT EXISTS public.movies (
      id TEXT PRIMARY KEY,
      title TEXT,
      overview TEXT,
      poster_url TEXT,
      release_date TEXT,
      genre TEXT
    );
  `;
  
  await pool.query(queryText);
};

