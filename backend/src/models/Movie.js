import { db } from '../config/db.js';

export const Movie = {
  // Opcional: Se quiser armazenar um cache de filmes localmente no PG
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM movies');
      return result.rows;
    } catch (e) {
      console.warn("Tabela movies não existe ou falhou. Ignorando.");
      return [];
    }
  },

  async getById(id) {
    try {
      const result = await db.query('SELECT * FROM movies WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (e) {
      return null;
    }
  },

  async create(movieData) {
    const query = `
      INSERT INTO movies (id, title, overview, poster_url, release_date, genre)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    const values = [
      movieData.id,
      movieData.title,
      movieData.overview,
      movieData.poster_url,
      movieData.release_date,
      movieData.genre
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (e) {
      return null;
    }
  }
};
