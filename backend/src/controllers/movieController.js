import { Movie } from '../models/Movie.js';

// Listar todos os filmes
export const getMovies = async (req, res) => {
  try {
    const movies = await Movie.getAll();
    res.json(movies);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    res.status(500).json({ error: 'Erro ao buscar filmes do servidor.' });
  }
};

// Listar filme específico por ID
export const getMovieById = async (req, res) => {
  const { id } = req.params;
  try {
    const movie = await Movie.getById(id);
    if (!movie) {
      return res.status(404).json({ error: 'Filme não encontrado.' });
    }
    res.json(movie);
  } catch (error) {
    console.error('Erro ao buscar filme:', error);
    res.status(500).json({ error: 'Erro ao buscar informações do filme.' });
  }
};

// Criar um novo filme no catálogo
export const createMovie = async (req, res) => {
  const { title, overview, poster_url, release_date, genre } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }
  
  try {
    const movie = await Movie.create({ title, overview, poster_url, release_date, genre });
    res.status(201).json(movie);
  } catch (error) {
    console.error('Erro ao criar filme:', error);
    res.status(500).json({ error: 'Erro ao registrar filme no catálogo.' });
  }
};
