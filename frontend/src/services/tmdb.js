// Serviço de integração com o TMDB (através do proxy do Backend para maior segurança)
// Documentação: https://developer.themoviedb.org/docs

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

// Mapa de IDs de gêneros para nome
export const MOVIE_GENRES = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia',
  80: 'Crime', 99: 'Documentário', 18: 'Drama', 10751: 'Família',
  14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música',
  9648: 'Mistério', 10749: 'Romance', 878: 'Ficção Científica',
  10770: 'Cinema TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
};

export const TV_GENRES = {
  10759: 'Ação & Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 10762: 'Kids',
  9648: 'Mistério', 10763: 'Notícias', 10764: 'Reality', 10765: 'Sci-Fi & Fantasia',
  10766: 'Novela', 10767: 'Talk', 10768: 'Guerra & Política', 37: 'Faroeste',
};

// Normaliza um item do TMDB (filme ou série) para o formato interno do app
export const normalizeItem = (item, mediaType = 'movie') => {
  const isMovie = mediaType === 'movie' || item.media_type === 'movie';
  const type = item.media_type || mediaType;
  const genreMap = isMovie ? MOVIE_GENRES : TV_GENRES;
  const genreNames = (item.genre_ids || []).map(id => genreMap[id]).filter(Boolean);

  return {
    id: `${type}_${item.id}`,        // ID único: "movie_123" ou "tv_456"
    tmdb_id: item.id,
    media_type: type,
    title: item.title || item.name || 'Sem título',
    overview: item.overview || '',
    poster_url: item.poster_path ? `${IMG_BASE}${item.poster_path}` : null,
    backdrop_url: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : null,
    genre: genreNames.join(', ') || (isMovie ? 'Filme' : 'Série'),
    release_date: item.release_date || item.first_air_date || null,
    tmdb_rating: item.vote_average ? Number(item.vote_average).toFixed(1) : null,
    vote_count: item.vote_count || 0,
    popularity: item.popularity || 0,
    original_language: item.original_language,
  };
};

// Chamada genérica de proxy para o backend
const fetchTMDB = async (endpoint, params = {}) => {
  const url = new URL(`${API_URL}/tmdb`, window.location.origin);
  url.searchParams.set('path', endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.status_message || `Erro ${res.status} ao acessar o TMDB`);
  }
  return res.json();
};

// ─── Endpoints públicos ───────────────────────────────────────────────────────

/** Filmes em tendência na semana */
export const getTrendingMovies = async (page = 1) => {
  const data = await fetchTMDB('/trending/movie/week', { page });
  return data.results.map(m => normalizeItem(m, 'movie'));
};

/** Séries em tendência na semana */
export const getTrendingTV = async (page = 1) => {
  const data = await fetchTMDB('/trending/tv/week', { page });
  return data.results.map(m => normalizeItem(m, 'tv'));
};

/** Filmes populares */
export const getPopularMovies = async (page = 1) => {
  const data = await fetchTMDB('/movie/popular', { page });
  return data.results.map(m => normalizeItem(m, 'movie'));
};

/** Séries populares */
export const getPopularTV = async (page = 1) => {
  const data = await fetchTMDB('/tv/popular', { page });
  return data.results.map(m => normalizeItem(m, 'tv'));
};

/** Filmes em cartaz agora nos cinemas */
export const getNowPlaying = async (page = 1) => {
  const data = await fetchTMDB('/movie/now_playing', { page });
  return data.results.map(m => normalizeItem(m, 'movie'));
};

/** Séries em exibição hoje */
export const getAiringToday = async (page = 1) => {
  const data = await fetchTMDB('/tv/airing_today', { page });
  return data.results.map(m => normalizeItem(m, 'tv'));
};

/** Busca unificada por texto (filmes + séries) */
export const searchMulti = async (query, page = 1) => {
  if (!query.trim()) return [];
  const data = await fetchTMDB('/search/multi', { query, page, include_adult: false });
  return data.results
    .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
    .map(r => normalizeItem(r, r.media_type));
};

/** Busca avançada com filtros (Discover) */
export const discoverContent = async (mediaType = 'movie', filters = {}, page = 1) => {
  const params = { page };
  if (filters.genre) {
    params.with_genres = filters.genre;
  }
  if (filters.year) {
    if (mediaType === 'movie') {
      params.primary_release_year = filters.year;
    } else {
      params.first_air_date_year = filters.year;
    }
  }
  if (filters.sortBy) {
    params.sort_by = filters.sortBy;
  } else {
    params.sort_by = 'popularity.desc';
  }
  if (filters.maxRuntime) {
    params['with_runtime.lte'] = filters.maxRuntime;
  }

  const data = await fetchTMDB(`/discover/${mediaType}`, params);
  return data.results.map(item => normalizeItem(item, mediaType));
};

/** Detalhes completos de um item (inclui créditos, watch/providers e vídeos) */
export const getDetails = async (tmdbId, mediaType) => {
  const endpoint = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  
  // Usamos append_to_response para obter créditos (elenco), provedores de streaming e vídeos na mesma chamada!
  const data = await fetchTMDB(endpoint, { append_to_response: 'credits,watch/providers,videos' });

  const genreNames = (data.genres || []).map(g => g.name).join(', ');
  const releaseDate = data.release_date || data.first_air_date || null;

  // Processar watch providers (Brasil)
  const providersBR = data['watch/providers']?.results?.BR || {};
  const flatrate = providersBR.flatrate || [];
  const buy = providersBR.buy || [];
  const rent = providersBR.rent || [];
  
  const formatProvider = (p) => ({
    name: p.provider_name,
    logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
  });

  const watchProviders = {
    flatrate: flatrate.map(formatProvider),
    buy: buy.map(formatProvider),
    rent: rent.map(formatProvider),
    link: providersBR.link || null,
  };

  // Processar vídeos (buscar trailer oficial no YouTube)
  const videos = data.videos?.results || [];
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
                  videos.find(v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip')) ||
                  videos[0];
  
  const trailerUrl = trailer && trailer.site === 'YouTube'
    ? `https://www.youtube.com/embed/${trailer.key}`
    : null;

  return {
    id: `${mediaType}_${data.id}`,
    tmdb_id: data.id,
    media_type: mediaType,
    title: data.title || data.name,
    overview: data.overview,
    poster_url: data.poster_path ? `${IMG_BASE}${data.poster_path}` : null,
    backdrop_url: data.backdrop_path ? `${BACKDROP_BASE}${data.backdrop_path}` : null,
    genre: genreNames || (mediaType === 'movie' ? 'Filme' : 'Série'),
    release_date: releaseDate,
    tmdb_rating: data.vote_average ? Number(data.vote_average).toFixed(1) : null,
    vote_count: data.vote_count || 0,
    runtime: data.runtime || (data.episode_run_time?.[0]) || null,
    tagline: data.tagline || null,
    status: data.status || null,
    watch_providers: watchProviders,
    trailer_url: trailerUrl,
    production_countries: data.production_countries || [],
  };
};
