import { jwt } from '../utils/jwt.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validar o token localmente usando a chave secreta JWT
    const decoded = jwt.verify(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Não autorizado ou sessão expirada.' });
    }

    // Injetar o usuário autenticado na requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_metadata: decoded.user_metadata
    };
    
    // Injeta um dummy supabase no request para evitar crashes de código legado (se houver)
    req.supabase = {};
    
    next();
  } catch (err) {
    console.error('Erro de autenticação local:', err);
    return res.status(401).json({ error: 'Erro interno ao validar autenticação.' });
  }
};
