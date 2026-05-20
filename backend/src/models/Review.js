import { supabase as anonClient } from '../config/supabase.js';

export const Review = {
  // Obter todas as avaliações de um filme específico
  async getByMovieId(movieId, client = anonClient) {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Criar uma nova avaliação/comentário
  async create(reviewData, client = anonClient) {
    const { data, error } = await client
      .from('reviews')
      .insert([
        {
          movie_id: reviewData.movie_id,
          user_id: reviewData.user_id,
          user_email: reviewData.user_email,
          rating: reviewData.rating,
          comment: reviewData.comment
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar avaliação específica (verificando o dono)
  async delete(id, userId, client = anonClient) {
    const { data, error } = await client
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data;
  }
};
