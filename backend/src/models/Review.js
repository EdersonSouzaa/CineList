import { db } from '../config/db.js';
import crypto from 'crypto';

export const Review = {
  // Obter todas as avaliações de um filme específico
  async getByMovieId(movieId) {
    const reviews = db.getCollection('reviews');
    const likes = db.getCollection('review_likes');

    // Filtra as avaliações pelo ID do filme
    const movieReviews = reviews
      .filter(r => r.movie_id === String(movieId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Mapeia curtidas para cada avaliação
    return movieReviews.map(review => {
      const reviewLikes = likes.filter(l => l.review_id === review.id);
      return {
        ...review,
        like_count: reviewLikes.length,
        liked_by_users: reviewLikes.map(l => l.user_id)
      };
    });
  },

  // Criar uma nova avaliação/comentário
  async create(reviewData) {
    const reviews = db.getCollection('reviews');

    const newReview = {
      id: crypto.randomUUID(),
      movie_id: String(reviewData.movie_id),
      user_id: reviewData.user_id,
      user_email: reviewData.user_email,
      rating: reviewData.rating,
      comment: reviewData.comment,
      is_spoiler: !!reviewData.is_spoiler,
      created_at: new Date().toISOString()
    };

    reviews.push(newReview);
    db.saveCollection('reviews', reviews);

    return newReview;
  },

  // Deletar avaliação específica (verificando o dono)
  async delete(id, userId) {
    const reviews = db.getCollection('reviews');
    const likes = db.getCollection('review_likes');

    const index = reviews.findIndex(r => r.id === id && r.user_id === userId);
    if (index === -1) {
      return null;
    }

    const [deletedReview] = reviews.splice(index, 1);
    db.saveCollection('reviews', reviews);

    // Remove curtidas órfãs dessa avaliação
    const updatedLikes = likes.filter(l => l.review_id !== id);
    db.saveCollection('review_likes', updatedLikes);

    return [deletedReview];
  },

  // Obter todas as avaliações de um usuário específico
  async getByUserId(userId) {
    const reviews = db.getCollection('reviews');
    const likes = db.getCollection('review_likes');

    const userReviews = reviews
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return userReviews.map(review => {
      const reviewLikes = likes.filter(l => l.review_id === review.id);
      return {
        ...review,
        like_count: reviewLikes.length,
        liked_by_users: reviewLikes.map(l => l.user_id)
      };
    });
  }
};
