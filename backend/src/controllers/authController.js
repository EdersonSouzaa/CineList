import { db } from '../config/db.js';
import { hash } from '../utils/hash.js';
import { jwt } from '../utils/jwt.js';
import crypto from 'crypto';

export const register = async (req, res) => {
  const { email, password, display_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const users = db.getCollection('users');
  
  // Verifica se o usuário já existe
  const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
  }

  // Cria o novo usuário
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password: hash.hashPassword(password),
    display_name: display_name || email.split('@')[0],
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  db.saveCollection('users', users);

  // Gera a sessão (JWT)
  const tokenPayload = {
    id: newUser.id,
    email: newUser.email,
    user_metadata: {
      display_name: newUser.display_name
    }
  };
  const accessToken = jwt.sign(tokenPayload);

  // Retorna estrutura compatível com a sessão do Supabase
  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      created_at: newUser.created_at,
      user_metadata: {
        display_name: newUser.display_name
      }
    },
    session: {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 604800, // 7 dias em segundos
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        user_metadata: {
          display_name: newUser.display_name
        }
      }
    }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const users = db.getCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !hash.compare(password, user.password)) {
    return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
  }

  // Gera o token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    user_metadata: {
      display_name: user.display_name
    }
  };
  const accessToken = jwt.sign(tokenPayload);

  // Retorna estrutura compatível com o Supabase
  res.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: {
        display_name: user.display_name
      }
    },
    session: {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 604800,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: {
          display_name: user.display_name
        }
      }
    }
  });
};
