import { db } from '../config/db.js';
import crypto from 'crypto';

export const Movie = {
  // Obter todos os filmes
  async getAll() {
    return db.getCollection('movies');
  },

  // Obter filme específico pelo ID
  async getById(id) {
    const movies = db.getCollection('movies');
    return movies.find(m => m.id === id) || null;
  },

  // Criar um novo filme (caso queira expandir o catálogo)
  async create(movieData) {
    const movies = db.getCollection('movies');
    
    const newMovie = {
      id: crypto.randomUUID(),
      title: movieData.title,
      overview: movieData.overview,
      poster_url: movieData.poster_url,
      release_date: movieData.release_date,
      genre: movieData.genre
    };

    movies.push(newMovie);
    db.saveCollection('movies', movies);
    
    return newMovie;
  }
};
