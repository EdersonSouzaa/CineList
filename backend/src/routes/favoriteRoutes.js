import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Obter a biblioteca de favoritos do usuário (necessita login)
router.get('/', requireAuth, getFavorites);

// Adicionar filme aos favoritos (necessita login)
router.post('/', requireAuth, addFavorite);

// Remover filme dos favoritos (necessita login)
router.delete('/:movieId', requireAuth, removeFavorite);

export default router;
