import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, Film, Tv, Clapperboard, Loader2, SlidersHorizontal, Trash2, Shuffle } from 'lucide-react';
import { api } from '../services/api.js';
import {
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getPopularTV,
  getNowPlaying,
  getAiringToday,
  searchMulti,
  discoverContent,
  getDetails,
  MOVIE_GENRES,
  TV_GENRES,
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

const SkeletonLoader = () => (
  <div className="skeleton-grid">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-shimmer" />
        <div className="skeleton-poster" />
        <div className="skeleton-info">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-meta" />
        </div>
      </div>
    ))}
  </div>
);

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
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Seleciona um filme ou série aleatória garantindo trailer e watch providers
  const handleRandomSelect = async () => {
    setLoadingRandom(true);
    try {
      let selectedDetails = null;
      let candidates = [];

      if (isSearching) {
        candidates = [...searchResults];
      } else if (isFilterActive) {
        candidates = [...items];
      } else {
        // Busca de uma página aleatória do TMDB (1 a 5)
        const randomPage = Math.floor(Math.random() * 5) + 1;
        
        if (activeTab === 'trending') {
          const pickMovie = Math.random() > 0.5;
          if (pickMovie) {
            candidates = await getTrendingMovies(randomPage);
          } else {
            candidates = await getTrendingTV(randomPage);
          }
        } else if (activeTab === 'movies') {
          candidates = await getPopularMovies(randomPage);
        } else if (activeTab === 'tv') {
          candidates = await getPopularTV(randomPage);
        } else if (activeTab === 'nowplaying') {
          const pickMovie = Math.random() > 0.5;
          if (pickMovie) {
            candidates = await getNowPlaying(randomPage);
          } else {
            candidates = await getAiringToday(randomPage);
          }
        }
      }

      if (!candidates || candidates.length === 0) {
        addToast('Nenhum título disponível para escolher.', 'info');
        setLoadingRandom(false);
        return;
      }

      // Embaralhar candidatos para garantir aleatoriedade real
      const shuffled = candidates.sort(() => Math.random() - 0.5);

      // Limitar a busca sequencial a no máximo 15 candidatos para evitar sobrecarga de rede
      const maxChecks = Math.min(shuffled.length, 15);
      
      // Abre uma notificação indicando que estamos procurando uma produção bem completa
      addToast('Procurando um título completo com trailer e streaming...', 'info');

      for (let i = 0; i < maxChecks; i++) {
        const candidate = shuffled[i];
        try {
          const details = await getDetails(candidate.tmdb_id, candidate.media_type);
          const hasTrailer = !!details.trailer_url;
          const hasStreaming = details.watch_providers?.flatrate?.length > 0;

          if (hasTrailer && hasStreaming) {
            selectedDetails = details;
            break;
          }
        } catch (e) {
          // Ignora erros de rede individuais e passa para o próximo
        }
      }

      // Se nenhum candidato tiver ambos, tenta buscar qualquer um com pelo menos um dos recursos (trailer ou streaming)
      if (!selectedDetails) {
        for (let i = 0; i < maxChecks; i++) {
          const candidate = shuffled[i];
          try {
            const details = await getDetails(candidate.tmdb_id, candidate.media_type);
            const hasTrailer = !!details.trailer_url;
            const hasStreaming = details.watch_providers?.flatrate?.length > 0;

            if (hasTrailer || hasStreaming) {
              selectedDetails = details;
              break;
            }
          } catch (e) {
            // Ignora erros
          }
        }
      }

      // Fallback final: se ainda não encontrou nada enriquecido, pega o primeiro da lista
      if (!selectedDetails && shuffled.length > 0) {
        try {
          selectedDetails = await getDetails(shuffled[0].tmdb_id, shuffled[0].media_type);
        } catch (e) {
          selectedDetails = shuffled[0];
        }
      }

      if (selectedDetails) {
        setSelectedMovie(selectedDetails);
        addToast(`Aleatório selecionado: ${selectedDetails.title}`, 'success');
      } else {
        addToast('Não foi possível selecionar um item aleatório.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao obter recomendação aleatória.', 'error');
    } finally {
      setLoadingRandom(false);
    }
  };
  
  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: 'movie',
    genre: '',
    year: '',
    sortBy: 'popularity.desc',
    maxRuntime: '',
  });

  const searchTimeout               = useRef(null);
  const loadMoreRef                 = useRef(null);
  const isSearching                 = search.trim().length > 0;
  
  const isFilterActive = filters.genre !== '' || filters.year !== '' || filters.sortBy !== 'popularity.desc' || filters.maxRuntime !== '';

  // Carrega favoritos do backend
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/favorites');
      setFavorites(data.map(f => String(f.movie_id)));
    } catch { /* silencioso */ }
  }, [user]);

  // Carrega catálogo ou discover
  const loadData = useCallback(async (pg = 1) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      let data = [];
      if (isFilterActive) {
        data = await discoverContent(filters.mediaType, {
          genre: filters.genre,
          year: filters.year,
          sortBy: filters.sortBy,
          maxRuntime: filters.maxRuntime
        }, pg);
      } else {
        data = await fetchByTab(activeTab, pg);
        // Na aba trending mistura filmes e séries; ordena por popularidade
        if (activeTab === 'trending' || activeTab === 'nowplaying') {
          data = [...data].sort((a, b) => b.popularity - a.popularity);
        }
      }
      setItems(prev => pg === 1 ? data : [...prev, ...data]);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Erro ao carregar catálogo.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, filters, isFilterActive, addToast]);

  // Reset de filtros quando muda aba do catálogo
  useEffect(() => {
    setFilters({
      mediaType: activeTab === 'tv' ? 'tv' : 'movie',
      genre: '',
      year: '',
      sortBy: 'popularity.desc',
      maxRuntime: '',
    });
    setPage(1);
    setSearch('');
    loadFavorites();
  }, [activeTab, loadFavorites]);

  // Carrega dados quando filtros mudam
  useEffect(() => {
    setPage(1);
    loadData(1);
  }, [filters, loadData]);

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

  // Infinite Scroll usando IntersectionObserver
  useEffect(() => {
    if (isSearching) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !loading && !loadingMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          loadData(nextPage);
          return nextPage;
        });
      }
    }, { threshold: 0.1 });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, loadingMore, isSearching, loadData]);

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      mediaType: activeTab === 'tv' ? 'tv' : 'movie',
      genre: '',
      year: '',
      sortBy: 'popularity.desc',
      maxRuntime: '',
    });
  };

  const displayItems = isSearching ? searchResults : items;
  const genresToUse = filters.mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

  return (
    <div>
      {/* Barra de busca e Botão Filtros */}
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
              className="search-clear-btn"
              title="Limpar busca"
            >✕</button>
          )}
        </div>

        {!isSearching && (
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros avançados"
          >
            <SlidersHorizontal size={18} />
            <span>Filtros</span>
          </button>
        )}
      </div>

      {/* Painel de Filtros Avançados */}
      {!isSearching && showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Tipo</label>
            <select
              value={filters.mediaType}
              onChange={e => handleFilterChange('mediaType', e.target.value)}
              className="filter-select"
            >
              <option value="movie">Filmes</option>
              <option value="tv">Séries</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Gênero</label>
            <select
              value={filters.genre}
              onChange={e => handleFilterChange('genre', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os Gêneros</option>
              {Object.entries(genresToUse).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Ano</label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="Ex: 2024"
              value={filters.year}
              onChange={e => handleFilterChange('year', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Duração</span>
              <span className="slider-value" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>
                {filters.maxRuntime ? `${filters.maxRuntime} min` : 'Qualquer'}
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
              <input
                type="range"
                min="15"
                max="240"
                step="5"
                value={filters.maxRuntime || '240'}
                onChange={e => {
                  const val = e.target.value;
                  handleFilterChange('maxRuntime', val === '240' ? '' : val);
                }}
                className="filter-slider"
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
 
          <div className="filter-group">
            <label>Ordenar por</label>
            <select
              value={filters.sortBy}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="popularity.desc">Mais Populares</option>
              <option value="vote_average.desc">Melhor Avaliados</option>
              <option value="primary_release_date.desc">Mais Recentes</option>
              <option value="vote_count.desc">Mais Votados</option>
            </select>
          </div>

          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="filter-clear-btn"
              title="Limpar Filtros"
            >
              <Trash2 size={16} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      )}

      {/* Abas de categoria (ocultas durante busca ou se filtro ativo) */}
      {!isSearching && !isFilterActive && (
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

          <button
            className="random-select-btn"
            onClick={handleRandomSelect}
            disabled={loadingRandom}
            title="Ver algo aleatório"
          >
            {loadingRandom ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Shuffle size={16} />
            )}
            <span>Aleatório</span>
          </button>
        </div>
      )}

      {/* Grid de filmes/séries */}
      {loading ? (
        <SkeletonLoader />
      ) : displayItems.length === 0 ? (
        <div className="no-data-card glass-panel">
          <Search size={48} />
          <h3>{isSearching ? 'Nenhum resultado encontrado' : 'Nenhum conteúdo disponível'}</h3>
          <p>{isSearching ? `Tente outro título para "${search}".` : 'Tente mudar de categoria ou limpar os filtros.'}</p>
        </div>
      ) : (
        <>
          {isSearching && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
              {searchResults.length} resultado(s) para "{search}"
            </p>
          )}
          
          {isFilterActive && !isSearching && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
              Filtro ativo: {filters.mediaType === 'movie' ? 'Filmes' : 'Séries'}
              {filters.genre && ` • ${genresToUse[filters.genre]}`}
              {filters.year && ` • Ano ${filters.year}`}
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

          {/* Elemento observador para Scroll Infinito */}
          {!isSearching && (
            <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0' }}>
              {loadingMore && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Carregando mais conteúdo...</span>
                </div>
              )}
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
          onReviewAdded={loadFavorites} // atualiza favoritos caso mude
        />
      )}
    </div>
  );
};

export default Dashboard;
