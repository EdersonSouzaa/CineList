import express from 'express';
import { getReviews, createReview, deleteReview, getMyReviews } from '../controllers/reviewController.js';
import { toggleLikeReview } from '../controllers/likeController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Obter avaliações do próprio usuário logado (necessita login)
router.get('/me', requireAuth, getMyReviews);

// Obter comentários/avaliações de um filme (público)
router.get('/:movieId', getReviews);

// Criar nova avaliação (necessita login)
router.post('/', requireAuth, createReview);

// Excluir uma avaliação própria (necessita login)
router.delete('/:id', requireAuth, deleteReview);

// Alternar curtida em um comentário (necessita login)
router.post('/:id/like', requireAuth, toggleLikeReview);

export default router;
