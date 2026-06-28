import { db } from '../config/db.js';
import crypto from 'crypto';

export const Favorite = {
  // Obter todos os favoritos do usuário
  async getByUserId(userId) {
    const favorites = db.getCollection('favorites');
    
    // Filtra favoritos pelo ID do usuário e ordena do mais recente
    return favorites
      .filter(f => f.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Adicionar filme/série aos favoritos (movie_id é string "movie_123" ou "tv_456")
  async add(movieId, userId, userEmail) {
    const favorites = db.getCollection('favorites');

    // Evita duplicados
    const isAlreadyFavorite = favorites.some(f => f.movie_id === String(movieId) && f.user_id === userId);
    if (isAlreadyFavorite) {
      return favorites.find(f => f.movie_id === String(movieId) && f.user_id === userId);
    }

    const newFavorite = {
      id: crypto.randomUUID(),
      movie_id: String(movieId),
      user_id: userId,
      user_email: userEmail,
      created_at: new Date().toISOString()
    };

    favorites.push(newFavorite);
    db.saveCollection('favorites', favorites);

    return newFavorite;
  },

  // Remover filme/série dos favoritos
  async remove(movieId, userId) {
    const favorites = db.getCollection('favorites');

    const index = favorites.findIndex(f => f.movie_id === String(movieId) && f.user_id === userId);
    if (index === -1) {
      return [];
    }

    const [deletedFavorite] = favorites.splice(index, 1);
    db.saveCollection('favorites', favorites);

    return [deletedFavorite];
  }
};
