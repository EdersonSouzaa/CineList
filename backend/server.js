import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importando as rotas do MVC
// Nota: A rota de filmes foi removida — o catálogo agora vem diretamente da API do TMDB (frontend)
import reviewRoutes from './src/routes/reviewRoutes.js';
import favoriteRoutes from './src/routes/favoriteRoutes.js';
import tmdbRoutes from './src/routes/tmdbRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para o frontend local e domínios de deploy (Render e Vercel)
const allowedOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.onrender.com') || 
                      origin.endsWith('.vercel.app');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
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
app.use('/api/auth', authRoutes);

// Health Check de rotas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API do CineList!',
    status: 'online'
  });
});

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
