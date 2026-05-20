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
        fontSize: '1.8rem',
        background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
      }}>
        Biblioteca de Favoritos
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
        <div className="movies-grid">
          {favorites.map(fav => (
            <MovieCard
              key={fav.favId}
              movie={fav.movie}
              isFavorite={true}
              onToggleFavorite={() => handleRemoveFavorite(fav.movie_id)}
              onClick={() => setSelectedMovie(fav.movie)}
            />
          ))}
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
