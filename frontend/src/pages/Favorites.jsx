import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../services/api.js';
import { getDetails } from '../services/tmdb.js';
import MovieCard from '../components/MovieCard.jsx';
import MovieDetailsModal from '../components/MovieDetailsModal.jsx';

export const Favorites = ({ user, addToast }) => {
  const [favorites, setFavorites]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await api.get('/favorites');

      // Enriquece cada favorito com os dados do TMDB
      // movie_id está no formato "movie_123" ou "tv_456"
      const enriched = await Promise.allSettled(
        data.map(async (fav) => {
          const movieId = String(fav.movie_id);
          const [mediaType, tmdbId] = movieId.split('_');
          if (!tmdbId) return null;

          try {
            const tmdbData = await getDetails(Number(tmdbId), mediaType);
            // Busca média das avaliações do app para este item
            const reviews = await api.get(`/reviews/${encodeURIComponent(movieId)}`).catch(() => []);
            const average = reviews.length > 0
              ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              : 0;
            return { favId: fav.id, movie_id: movieId, movie: { ...tmdbData, average_rating: average } };
          } catch {
            return null;
          }
        })
      );

      const validFavs = enriched
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      setFavorites(validFavs);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar sua lista de favoritos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    const strId = String(movieId);
    try {
      await api.delete(`/favorites/${encodeURIComponent(strId)}`);
      setFavorites(prev => prev.filter(f => f.movie_id !== strId));
      addToast('Filme removido dos seus favoritos.', 'info');
    } catch {
      addToast('Erro ao desfavoritar o filme.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="no-data-card glass-panel" style={{ padding: '6rem 2rem' }}>
        <Heart size={48} style={{ color: 'var(--danger)', strokeWidth: 1.5 }} />
        <h3>Faça login para ver seus favoritos</h3>
        <p>Entre na sua conta para acessar sua biblioteca de favoritos!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        marginBottom: '2rem',
        fontFamily: 'var(--font-title)',
        fontSize: '2rem',
        fontWeight: '800',
        color: 'var(--text-primary)',
      }}>
        Meus Ingressos
      </h2>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Carregando sua lista...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="no-data-card glass-panel" style={{ padding: '6rem 2rem' }}>
          <Heart size={48} style={{ color: 'var(--danger)', strokeWidth: 1.5 }} />
          <h3>Sua lista está vazia</h3>
          <p>Explore o catálogo e clique no ❤️ para salvar filmes e séries aqui!</p>
        </div>
      ) : (
        <div className="tickets-list">
          {favorites.map(fav => {
            const movie = fav.movie;
            const year = movie.release_date ? movie.release_date.split('-')[0] : null;
            const isTV = movie.media_type === 'tv';
            return (
              <div 
                key={fav.favId} 
                className="ticket-card"
                onClick={() => setSelectedMovie(movie)}
              >
                {/* Poster do Ingresso */}
                <img
                  src={movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'}
                  alt={movie.title}
                  className="ticket-card-poster"
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
                  }}
                />

                {/* Detalhes do Ingresso */}
                <div className="ticket-card-details">
                  <div>
                    <h3 className="ticket-card-title">{movie.title}</h3>
                    <span className="ticket-card-genre">{movie.genre || (isTV ? 'Série' : 'Filme')}</span>
                  </div>

                  <div className="ticket-card-meta">
                    <div className="ticket-card-rating-group">
                      <div className="ticket-card-rating">
                        <Heart size={12} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
                        <span>{movie.average_rating > 0 ? Number(movie.average_rating).toFixed(1) : (movie.tmdb_rating ? Number(movie.tmdb_rating).toFixed(1) : '0.0')}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>•</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{year || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      {movie.tmdb_rating && Number(movie.tmdb_rating) > 0 && (
                        <span className="badge-imdb-rating">
                          TMDB {Number(movie.tmdb_rating).toFixed(1)}
                        </span>
                      )}

                      <button
                        className="ticket-card-fav-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(fav.movie_id);
                        }}
                        title="Remover dos favoritos"
                      >
                        <Heart size={18} style={{ fill: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          user={user}
          onClose={() => setSelectedMovie(null)}
          addToast={addToast}
          onReviewAdded={fetchFavorites}
        />
      )}
    </div>
  );
};

export default Favorites;
