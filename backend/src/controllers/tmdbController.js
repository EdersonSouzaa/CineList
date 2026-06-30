import dotenv from 'dotenv';
dotenv.config();

const TMDB_KEY = process.env.TMDB_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Lista de palavras bloqueadas para purificar o app de conteúdos adultos/18+
const BLACKLIST = [
  'hentai', 'porno', 'porn', 'xxx', 'sexo', 'erotico', 'erotica', 'erótico', 'erótica',
  'softcore', 'playboy', 'kamasutra', 'ninfeta', 'nudez', 'nude', 'sexe', 'sensual'
];

// Helper para verificar se um texto contém palavras bloqueadas
const containsBlockedWord = (text) => {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // 1. Verifica termos da lista negra
  const hasBlocked = BLACKLIST.some(word => textLower.includes(word));
  if (hasBlocked) return true;
  
  // 2. Verifica a palavra exata "sex" usando limite de palavra para evitar bloquear "sexta" ou "sexto"
  const hasSexWord = /\bsex\b/i.test(textLower);
  return hasSexWord;
};

export const getProxyTMDB = async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'O parâmetro path é obrigatório.' });
  }

  // 1. Verifica se a query de busca contém palavras impróprias
  const queryParam = req.query.query || '';
  if (containsBlockedWord(queryParam)) {
    return res.json({ results: [], page: 1, total_pages: 1, total_results: 0 });
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

  // Força a remoção de qualquer produção classificada como conteúdo adulto (+18)
  targetUrl.searchParams.set('include_adult', 'false');

  try {
    const response = await fetch(targetUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 2. Filtra os resultados da API para remover qualquer filme/série com palavras banidas no título ou descrição
    if (data.results && Array.isArray(data.results)) {
      data.results = data.results.filter(item => {
        const title = item.title || item.name || '';
        const overview = item.overview || '';
        return !containsBlockedWord(title) && !containsBlockedWord(overview);
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Erro no proxy do TMDB:', error);
    return res.status(500).json({ error: 'Falha ao conectar com o serviço do TMDB.' });
  }
};
