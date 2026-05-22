import { Review } from '../models/Review.js';

// Obter as avaliações de um filme específico
export const getReviews = async (req, res) => {
  const { movieId } = req.params;
  try {
    const reviews = await Review.getByMovieId(movieId, req.supabase);
    res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários do filme.' });
  }
};

// Criar nova avaliação para um filme
export const createReview = async (req, res) => {
  const { movie_id, rating, comment } = req.body;
  
  // Dados injetados pelo middleware requireAuth
  const user_id = req.user.id;
  const user_email = req.user.user_metadata?.display_name || req.user.email;

  if (!movie_id || !rating) {
    return res.status(400).json({ error: 'Filme e nota de avaliação são obrigatórios.' });
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'A nota deve ser um número entre 1 e 5 estrelas.' });
  }

  try {
    const review = await Review.create({
      movie_id: String(movie_id),  // Garante que o ID seja string ("movie_123" ou "tv_456")
      user_id,
      user_email,
      rating: ratingNum,
      comment
    }, req.supabase);
    res.status(201).json(review);
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    res.status(500).json({ error: 'Erro ao processar sua avaliação no servidor.' });
  }
};

// Deletar avaliação própria
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const data = await Review.delete(id, user_id, req.supabase);
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada ou você não tem permissão para excluí-la.' });
    }
    res.json({ message: 'Comentário/Avaliação excluído com sucesso.', data });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ error: 'Erro ao tentar excluir a avaliação.' });
  }
};

// Obter avaliações do usuário autenticado
export const getMyReviews = async (req, res) => {
  const user_id = req.user.id;
  try {
    const reviews = await Review.getByUserId(user_id, req.supabase);
    res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar suas avaliações.' });
  }
};
