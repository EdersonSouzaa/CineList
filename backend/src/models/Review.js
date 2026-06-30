import { db } from '../config/db.js';

export const Review = {
  async getByMovieId(movieId) {
    const query = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM review_likes l WHERE l.review_id = r.id) as like_count,
             COALESCE((SELECT json_agg(l.user_id) FROM review_likes l WHERE l.review_id = r.id), '[]'::json) as liked_by_users
      FROM reviews r
      WHERE r.movie_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query, [String(movieId)]);
    return result.rows;
  },

  async create(reviewData) {
    const query = `
      INSERT INTO reviews (movie_id, user_id, user_email, rating, comment, is_spoiler)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      String(reviewData.movie_id),
      reviewData.user_id,
      reviewData.user_email,
      reviewData.rating,
      reviewData.comment,
      !!reviewData.is_spoiler
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async delete(id, userId) {
    const query = `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    // As curtidas serão removidas automaticamente se houver ON DELETE CASCADE no BD.
    // Caso não haja, deletamos manualmente:
    await db.query('DELETE FROM review_likes WHERE review_id = $1', [id]);
    
    return result.rows;
  },

  async getByUserId(userId) {
    const query = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM review_likes l WHERE l.review_id = r.id) as like_count,
             COALESCE((SELECT json_agg(l.user_id) FROM review_likes l WHERE l.review_id = r.id), '[]'::json) as liked_by_users
      FROM reviews r
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }
};
