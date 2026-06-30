import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './src/config/db.js';


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
    
    // Permite conexões locais (localhost/127.0.0.1) e também redes locais (ex: 192.168.x.x, 10.x.x.x, 172.x.x.x)
    // para viabilizar testes em múltiplos dispositivos (celulares, tablets, etc.)
    const isLocalNetwork = origin.startsWith('http://192.168.') || 
                           origin.startsWith('http://10.') || 
                           origin.startsWith('http://172.');
                           
    const isAllowed = allowedOrigins.includes(origin) || 
                      isLocalNetwork ||
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
// Registrados com e sem prefixo "/api" para total compatibilidade com o roteamento Serverless da Vercel
app.use('/api/reviews', reviewRoutes);
app.use('/reviews', reviewRoutes);

app.use('/api/favorites', favoriteRoutes);
app.use('/favorites', favoriteRoutes);

app.use('/api/tmdb', tmdbRoutes);
app.use('/tmdb', tmdbRoutes);

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Health Check de rotas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API do CineList!',
    status: 'online'
  });
});
app.get('/api', (req, res) => {
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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Servidor CineList está ativo e pronto!' 
  });
});

// Iniciando o servidor
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(`🚀 Servidor CineList rodando em http://localhost:${PORT}`);
  console.log(`📂 Padrão MVC configurado com sucesso!`);
  console.log(`===================================================`);
  
  try {
    console.log('⚡ Inicializando conexão e tabelas do banco de dados...');
    await initDatabase();
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro crítico ao inicializar o banco de dados:', err);
  }
});
export default app;
