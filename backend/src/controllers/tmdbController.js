import dotenv from 'dotenv';
dotenv.config();

const TMDB_KEY = process.env.TMDB_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const getProxyTMDB = async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'O parâmetro path é obrigatório.' });
  }

  // Copia os parâmetros da query da requisição original, removendo o "path"
  const params = { ...req.query };
  delete params.path;

  // Monta a URL para chamar a API oficial do TMDB
  const targetUrl = new URL(`${BASE_URL}${path}`);
  targetUrl.searchParams.set('api_key', TMDB_KEY);
  
  // Define pt-BR como padrão caso nenhum outro idioma tenha sido passado
  if (!params.language) {
    targetUrl.searchParams.set('language', 'pt-BR');
  }

  // Repassa todos os outros parâmetros (como page, query, etc.)
  Object.entries(params).forEach(([key, val]) => {
    targetUrl.searchParams.set(key, val);
  });

  try {
    const response = await fetch(targetUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error('Erro no proxy do TMDB:', error);
    return res.status(500).json({ error: 'Falha ao conectar com o serviço do TMDB.' });
  }
};
