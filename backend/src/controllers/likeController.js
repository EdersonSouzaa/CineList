import { db } from '../config/db.js';

export const toggleLikeReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const userId = req.user.id;

  try {
    // Tenta encontrar a curtida
    const existing = await db.query(
      'SELECT id FROM review_likes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    let liked = false;

    if (existing.rows.length > 0) {
      // Se já existe, remove
      await db.query('DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2', [reviewId, userId]);
      liked = false;
    } else {
      // Se não existe, cria
      await db.query('INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2)', [reviewId, userId]);
      liked = true;
    }

    // Busca o novo total e lista de usuários
    const countResult = await db.query('SELECT user_id FROM review_likes WHERE review_id = $1', [reviewId]);
    const currentReviewLikes = countResult.rows;

    return res.json({
      liked,
      like_count: currentReviewLikes.length,
      liked_by_users: currentReviewLikes.map(l => l.user_id)
    });
  } catch (error) {
    console.error('Erro ao alternar curtida em avaliação PostgreSQL:', error);
    return res.status(500).json({ error: 'Falha ao processar curtida no comentário.' });
  }
};
