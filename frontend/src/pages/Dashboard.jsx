import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, Film, Tv, Clapperboard, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import {
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getPopularTV,
  getNowPlaying,
  getAiringToday,
  searchMulti,
} from '../services/tmdb.js';
import MovieCard from '../components/MovieCard.jsx';
import MovieDetailsModal from '../components/MovieDetailsModal.jsx';

// Tabs do catálogo
const TABS = [
  { id: 'trending',    label: 'Tendências',  icon: TrendingUp },
  { id: 'movies',      label: 'Filmes',      icon: Film },
  { id: 'tv',          label: 'Séries',      icon: Tv },
  { id: 'nowplaying',  label: 'Em Cartaz',   icon: Clapperboard },
];

// Busca os dados de acordo com a aba ativa
const fetchByTab = async (tab, page = 1) => {
  switch (tab) {
    case 'trending':   return [...await getTrendingMovies(page), ...await getTrendingTV(page)];
    case 'movies':     return getPopularMovies(page);
    case 'tv':         return getPopularTV(page);
    case 'nowplaying': return [...await getNowPlaying(page), ...await getAiringToday(page)];
    default:           return getTrendingMovies(page);
  }
};

export const Dashboard = ({ user, addToast }) => {
  const [items, setItems]           = useState([]);
  const [favorites, setFavorites]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab]   = useState('trending');
  const [search, setSearch]         = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [page, setPage]             = useState(1);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const searchTimeout               = useRef(null);
  const isSearching                 = search.trim().length > 0;

  // Carrega favoritos do backend (apenas IDs string "movie_123")
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/favorites');
      // movie_id é armazenado como string "movie_123" ou "tv_456"
      setFavorites(data.map(f => String(f.movie_id)));
    } catch { /* silencioso */ }
  }, [user]);

  // Carrega catálogo de acordo com a aba
  const loadCatalog = useCallback(async (tab, pg = 1) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await fetchByTab(tab, pg);
      // Na aba trending mistura filmes e séries; ordena por popularidade
      const sorted = tab === 'trending' || tab === 'nowplaying'
        ? [...data].sort((a, b) => b.popularity - a.popularity)
        : data;
      setItems(prev => pg === 1 ? sorted : [...prev, ...sorted]);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Erro ao carregar catálogo do TMDB.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [addToast]);

  // Troca de aba
  useEffect(() => {
    setPage(1);
    setSearch('');
    loadCatalog(activeTab, 1);
    loadFavorites();
  }, [activeTab]);

  // Busca ao vivo com debounce de 400ms
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!search.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchMulti(search);
        setSearchResults(results);
      } catch (err) {
        addToast('Erro ao buscar. Tente novamente.', 'error');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handleToggleFavorite = async (movieId) => {
    if (!user) {
      addToast('Faça login para adicionar favoritos!', 'info');
      return;
    }
    const strId = String(movieId);
    const isFav = favorites.includes(strId);
    try {
      if (isFav) {
        await api.delete(`/favorites/${encodeURIComponent(strId)}`);
        setFavorites(prev => prev.filter(id => id !== strId));
        addToast('Removido dos favoritos!', 'info');
      } else {
        await api.post('/favorites', { movie_id: strId });
        setFavorites(prev => [...prev, strId]);
        addToast('Adicionado à biblioteca de favoritos!', 'success');
      }
    } catch (err) {
      addToast('Não foi possível atualizar favoritos.', 'error');
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCatalog(activeTab, nextPage);
  };

  const displayItems = isSearching ? searchResults : items;

  return (
    <div>
      {/* Barra de busca */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          {searching
            ? <Loader2 className="search-icon" size={20} style={{ animation: 'spin 1s linear infinite' }} />
            : <Search className="search-icon" size={20} />
          }
          <input
            type="text"
            className="search-input"
            placeholder="Buscar filmes e séries no TMDB..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0.5rem' }}
              title="Limpar busca"
            >✕</button>
          )}
        </div>
      </div>

      {/* Abas de categoria (ocultas durante busca) */}
      {!isSearching && (
        <div className="catalog-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`catalog-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de filmes/séries */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Buscando conteúdo no TMDB...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="no-data-card glass-panel">
          <Search size={48} />
          <h3>{isSearching ? 'Nenhum resultado encontrado' : 'Nenhum conteúdo disponível'}</h3>
          <p>{isSearching ? `Tente outro título para "${search}".` : 'Tente mudar de categoria ou verifique sua chave do TMDB.'}</p>
        </div>
      ) : (
        <>
          {isSearching && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
              {searchResults.length} resultado(s) para "{search}"
            </p>
          )}
          <div className="movies-grid">
            {displayItems.map(item => (
              <MovieCard
                key={item.id}
                movie={item}
                isFavorite={favorites.includes(String(item.id))}
                onToggleFavorite={handleToggleFavorite}
                onClick={() => setSelectedMovie(item)}
              />
            ))}
          </div>

          {/* Botão Carregar Mais (apenas no catálogo, não na busca) */}
          {!isSearching && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
              <button
                className="btn-load-more"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...</>
                ) : (
                  'Carregar Mais'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          user={user}
          onClose={() => setSelectedMovie(null)}
          addToast={addToast}
          onReviewAdded={() => {}} // reviews são por ID TMDB no backend
        />
      )}
    </div>
  );
};

export default Dashboard;
