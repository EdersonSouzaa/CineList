import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importando as rotas do MVC
// Nota: A rota de filmes foi removida — o catálogo agora vem diretamente da API do TMDB (frontend)
import reviewRoutes from './src/routes/reviewRoutes.js';
import favoriteRoutes from './src/routes/favoriteRoutes.js';
import tmdbRoutes from './src/routes/tmdbRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para o frontend local (React costuma rodar na 5173 por padrão com Vite)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express Middleware para parsear corpos JSON
app.use(express.json());

// Endpoints da API (avaliações e favoritos — catálogo vem do TMDB)
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Health Check de rotas
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Servidor CineList está ativo e pronto!' 
  });
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Servidor CineList rodando em http://localhost:${PORT}`);
  console.log(`📂 Padrão MVC configurado com sucesso!`);
  console.log(`===================================================`);
});
export default app;
