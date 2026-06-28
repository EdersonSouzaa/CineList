import { db } from '../config/db.js';

export const toggleLikeReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const userId = req.user.id;

  try {
    const likes = db.getCollection('review_likes');
    
    // Verifica se a curtida já existe para este comentário e usuário
    const likeIndex = likes.findIndex(l => l.review_id === reviewId && l.user_id === userId);
    
    let liked = false;

    if (likeIndex !== -1) {
      // Se já existe, remove a curtida
      likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // Se não existe, cria a nova curtida
      likes.push({ review_id: reviewId, user_id: userId });
      liked = true;
    }

    // Salva a coleção atualizada
    db.saveCollection('review_likes', likes);

    // Filtra todas as curtidas atuais dessa avaliação para obter totais atualizados
    const currentReviewLikes = likes.filter(l => l.review_id === reviewId);

    return res.json({
      liked,
      like_count: currentReviewLikes.length,
      liked_by_users: currentReviewLikes.map(l => l.user_id)
    });
  } catch (error) {
    console.error('Erro ao alternar curtida em avaliação local:', error);
    return res.status(500).json({ error: 'Falha ao processar curtida no comentário.' });
  }
};
