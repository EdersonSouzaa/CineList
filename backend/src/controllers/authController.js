import { db } from '../config/db.js';
import { hash } from '../utils/hash.js';
import { jwt } from '../utils/jwt.js';

export const register = async (req, res) => {
  const { email, password, display_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // Verifica se o usuário já existe
    const result = await db.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = hash.hashPassword(password);
    const displayName = display_name || email.split('@')[0];

    // Insere o novo usuário
    const insertResult = await db.query(
      `INSERT INTO users (email, password, display_name) 
       VALUES (lower($1), $2, $3) 
       RETURNING id, email, display_name, created_at`,
      [email, hashedPassword, displayName]
    );

    const newUser = insertResult.rows[0];

    // Gera a sessão (JWT)
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: { display_name: newUser.display_name }
    };
    const accessToken = jwt.sign(tokenPayload);

    // Retorna estrutura compatível com a sessão do Supabase
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        user_metadata: { display_name: newUser.display_name }
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 604800, // 7 dias em segundos
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
          user_metadata: { display_name: newUser.display_name }
        }
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao registrar usuário.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
    const user = result.rows[0];

    if (!user || !hash.compare(password, user.password)) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Gera o token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      user_metadata: { display_name: user.display_name }
    };
    const accessToken = jwt.sign(tokenPayload);

    // Retorna estrutura compatível com o Supabase
    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: { display_name: user.display_name }
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 604800,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          user_metadata: { display_name: user.display_name }
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao efetuar login.' });
  }
};

export const getMe = async (req, res) => {
  // A rota /me será protegida pelo middleware JWT, então req.user estará disponível
  try {
    const result = await db.query('SELECT id, email, display_name, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: { display_name: user.display_name }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao buscar dados do usuário.' });
  }
};
