import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Obter comentários/avaliações de um filme (público)
router.get('/:movieId', getReviews);

// Criar nova avaliação (necessita login)
router.post('/', requireAuth, createReview);

// Excluir uma avaliação própria (necessita login)
router.delete('/:id', requireAuth, deleteReview);

export default router;
