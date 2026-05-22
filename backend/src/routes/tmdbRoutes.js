import express from 'express';
import { getProxyTMDB } from '../controllers/tmdbController.js';

const router = express.Router();

// Rota genérica para proxy do TMDB (não necessita de autenticação, o TMDB em si é público)
router.get('/', getProxyTMDB);

export default router;
