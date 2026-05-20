import { supabase, createUserClient } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validar o token com o Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Não autorizado ou sessão expirada.' });
    }

    // Injetar o usuário autenticado na requisição
    req.user = user;
    // Criar um cliente Supabase autenticado para esta requisição (respeita RLS)
    req.supabase = createUserClient(token);
    next();
  } catch (err) {
    console.error('Erro de autenticação:', err);
    return res.status(401).json({ error: 'Erro interno ao validar autenticação.' });
  }
};
