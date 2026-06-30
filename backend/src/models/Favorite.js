import { db } from '../config/db.js';

export const Favorite = {
  async getByUserId(userId) {
    const query = `
      SELECT * FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  async add(movieId, userId, userEmail) {
    const query = `
      INSERT INTO favorites (movie_id, user_id, user_email)
      VALUES ($1, $2, $3)
      ON CONFLICT (movie_id, user_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [String(movieId), userId, userEmail]);
    
    // Se o conflito impediu o insert, fazemos um select
    if (result.rowCount === 0) {
      const selectResult = await db.query(
        'SELECT * FROM favorites WHERE movie_id = $1 AND user_id = $2',
        [String(movieId), userId]
      );
      return selectResult.rows[0];
    }
    
    return result.rows[0];
  },

  async remove(movieId, userId) {
    const query = `
      DELETE FROM favorites
      WHERE movie_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [String(movieId), userId]);
    return result.rows;
  }
};
