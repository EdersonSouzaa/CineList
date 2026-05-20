import express from 'express';
import { getMovies, getMovieById, createMovie } from '../controllers/movieController.js';

const router = express.Router();

// Obter todos os filmes
router.get('/', getMovies);

// Obter detalhes de um filme
router.get('/:id', getMovieById);

// Criar um novo filme no catálogo
router.post('/', createMovie);

export default router;
