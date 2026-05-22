import { supabase as anonClient } from '../config/supabase.js';

export const Review = {
  // Obter todas as avaliações de um filme específico
  async getByMovieId(movieId, client = anonClient) {
    try {
      const { data, error } = await client
        .from('reviews')
        .select('*, review_likes(user_id)')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(review => {
        const likes = review.review_likes || [];
        return {
          ...review,
          review_likes: undefined, // remove o campo bruto do retorno
          like_count: likes.length,
          liked_by_users: likes.map(l => l.user_id)
        };
      });
    } catch (err) {
      // Se a tabela review_likes não existir (PGRST200 ou erro de relacionamento/tabela não encontrada),
      // retorna as avaliações normalmente sem curtidas.
      if (err.code === 'PGRST200' || err.code === 'PGRST205' || err.message?.includes('review_likes')) {
        console.warn('⚠️ Tabela review_likes não encontrada no Supabase. Buscando avaliações sem curtidas...');
        const { data, error } = await client
          .from('reviews')
          .select('*')
          .eq('movie_id', movieId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data.map(review => ({
          ...review,
          like_count: 0,
          liked_by_users: []
        }));
      }
      throw err;
    }
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
  },

  // Obter todas as avaliações de um usuário específico
  async getByUserId(userId, client = anonClient) {
    try {
      const { data, error } = await client
        .from('reviews')
        .select('*, review_likes(user_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(review => {
        const likes = review.review_likes || [];
        return {
          ...review,
          review_likes: undefined,
          like_count: likes.length,
          liked_by_users: likes.map(l => l.user_id)
        };
      });
    } catch (err) {
      if (err.code === 'PGRST200' || err.code === 'PGRST205' || err.message?.includes('review_likes')) {
        console.warn('⚠️ Tabela review_likes não encontrada no Supabase. Buscando avaliações sem curtidas...');
        const { data, error } = await client
          .from('reviews')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data.map(review => ({
          ...review,
          like_count: 0,
          liked_by_users: []
        }));
      }
      throw err;
    }
  }
};
