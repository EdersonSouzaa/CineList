import React from 'react';
import { Heart, Star, Film, Tv } from 'lucide-react';

export const MovieCard = ({ movie, isFavorite, onToggleFavorite, onClick }) => {
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(movie.id);
  };

  // Usa nota interna do app se houver, senão usa a nota do TMDB
  const displayRating = movie.average_rating > 0
    ? { value: Number(movie.average_rating).toFixed(1), source: 'app' }
    : movie.tmdb_rating && Number(movie.tmdb_rating) > 0
      ? { value: Number(movie.tmdb_rating).toFixed(1), source: 'tmdb' }
      : null;

  const isTV = movie.media_type === 'tv';
  const year = movie.release_date ? movie.release_date.split('-')[0] : null;

  return (
    <div className="movie-card" onClick={onClick}>
      {/* Badge Filme ou Série */}
      <span className={`badge-type-overlay ${isTV ? 'badge-tv' : 'badge-movie'}`}>
        {isTV ? <Tv size={10} /> : <Film size={10} />}
        {isTV ? 'Série' : 'Filme'}
      </span>

      {/* Botão de favoritar */}
      <button
        className={`btn-fav-card ${isFavorite ? 'is-fav' : ''}`}
        onClick={handleFavoriteClick}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart size={18} />
      </button>

      {/* Pôster */}
      <img
        src={movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'}
        alt={movie.title}
        className="movie-card-poster"
        loading="lazy"
        onError={e => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
        }}
      />

      <div className="movie-card-info">
        <div>
          <h3 className="movie-title" title={movie.title}>{movie.title}</h3>
          <span className="movie-genre">{movie.genre || 'Geral'}</span>
        </div>
        
        <div className="movie-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="movie-rating">
              <Star size={12} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />
              <span>{displayRating ? displayRating.value : '0.0'}</span>
            </div>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>{year || 'N/A'}</span>
          </div>

          {movie.tmdb_rating && Number(movie.tmdb_rating) > 0 && (
            <span className="badge-imdb-rating">
              TMDB {Number(movie.tmdb_rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
