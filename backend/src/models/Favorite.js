import { supabase as anonClient } from '../config/supabase.js';

export const Favorite = {
  // Obter todos os favoritos do usuário
  // Retorna apenas os dados da tabela favorites (movie_id como string TMDB)
  async getByUserId(userId, client = anonClient) {
    const { data, error } = await client
      .from('favorites')
      .select('id, movie_id, user_id, user_email, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Adicionar filme/série aos favoritos (movie_id é string "movie_123" ou "tv_456")
  async add(movieId, userId, userEmail, client = anonClient) {
    const { data, error } = await client
      .from('favorites')
      .insert([{ movie_id: String(movieId), user_id: userId, user_email: userEmail }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remover filme/série dos favoritos
  async remove(movieId, userId, client = anonClient) {
    const { data, error } = await client
      .from('favorites')
      .delete()
      .eq('movie_id', String(movieId))
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  }
};
