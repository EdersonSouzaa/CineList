import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Pool do PostgreSQL usando a URL do banco (ex: fornecida pelo Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = {
  // Executa queries no PostgreSQL
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  },
  
  // Mantido apenas para compatibilidade (mas deve ser removido após atualizar os controllers)
  getCollection(name) {
    console.warn(`Atenção: getCollection chamada para '${name}'. Esta função está obsoleta com o PostgreSQL.`);
    return [];
  },
  saveCollection(name, collection) {
    console.warn(`Atenção: saveCollection chamada para '${name}'. Esta função está obsoleta com o PostgreSQL.`);
    return true;
  }
};
