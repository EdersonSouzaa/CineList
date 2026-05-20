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
    <div className="movie-card glass-panel" onClick={onClick}>
      {/* Badge Filme ou Série */}
      <span className={`media-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}`}>
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
          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
        }}
      />

      <div className="movie-card-info">
        <div>
          <h3 className="movie-title" title={movie.title}>{movie.title}</h3>
          <span className="movie-genre">{movie.genre || 'Geral'}</span>
        </div>
        <div className="movie-meta">
          <span>{year || 'N/A'}</span>
          {displayRating ? (
            <div className="movie-rating" title={displayRating.source === 'tmdb' ? 'Nota do TMDB' : 'Sua comunidade'}>
              <Star size={14} style={{ fill: 'var(--warning)', color: 'var(--warning)' }} />
              <span>{displayRating.value}</span>
              {displayRating.source === 'tmdb' && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '1px' }}>tmdb</span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem notas</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
