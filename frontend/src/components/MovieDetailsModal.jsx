import React, { useState, useEffect } from 'react';
import { X, Calendar, Film, Star, Clock, Tv } from 'lucide-react';
import { api } from '../services/api.js';
import { getDetails } from '../services/tmdb.js';
import ReviewForm from './ReviewForm.jsx';
import ReviewList from './ReviewList.jsx';

export const MovieDetailsModal = ({ movie, user, onClose, addToast, onReviewAdded }) => {
  const [details, setDetails]     = useState(movie);
  const [reviews, setReviews]     = useState([]);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  // Busca detalhes completos do TMDB (gêneros por nome, runtime, tagline)
  useEffect(() => {
    if (movie.tmdb_id && movie.media_type) {
      getDetails(movie.tmdb_id, movie.media_type)
        .then(d => setDetails(d))
        .catch(() => setDetails(movie));
    }
    fetchReviews();
  }, [movie.id]);

  const fetchReviews = async () => {
    setLoadingRevs(true);
    try {
      // O movie.id é "movie_123" ou "tv_456" — usado como chave no nosso backend
      const data = await api.get(`/reviews/${encodeURIComponent(movie.id)}`);
      setReviews(data);
    } catch {
      // silencioso — reviews são opcionais
    } finally {
      setLoadingRevs(false);
    }
  };

  const handleSubmitReview = async ({ rating, comment }) => {
    setSubmitting(true);
    try {
      const newReview = await api.post('/reviews', {
        movie_id: movie.id,
        rating,
        comment,
      });
      addToast('Avaliação publicada!', 'success');
      setReviews(prev => [newReview, ...prev]);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      addToast(err.message || 'Falha ao registrar avaliação.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      addToast('Comentário excluído!', 'success');
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      if (onReviewAdded) onReviewAdded();
    } catch {
      addToast('Falha ao excluir o comentário.', 'error');
    }
  };

  const communityAvg = reviews.length > 0
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); }
    catch { return d; }
  };

  const isTV = details.media_type === 'tv';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose} title="Fechar">
          <X size={18} />
        </button>

        {/* Backdrop como banner de fundo */}
        {details.backdrop_url && (
          <div className="modal-backdrop" style={{ backgroundImage: `url(${details.backdrop_url})` }} />
        )}

        <div className="modal-body">
          <div className="movie-header-section">
            <img
              src={details.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'}
              alt={details.title}
              className="modal-poster"
              onError={e => {
                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
              }}
            />

            <div className="modal-movie-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <span className={`media-type-badge ${isTV ? 'badge-tv' : 'badge-movie'}`} style={{ position: 'static' }}>
                  {isTV ? <Tv size={11} /> : <Film size={11} />}
                  {isTV ? 'Série' : 'Filme'}
                </span>
              </div>

              <h2 className="modal-movie-title">{details.title}</h2>

              {details.tagline && (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                  "{details.tagline}"
                </p>
              )}

              <div className="modal-tags">
                {details.genre && <span className="tag accent">{details.genre}</span>}

                {details.release_date && (
                  <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} /> {formatDate(details.release_date)}
                  </span>
                )}

                {details.runtime && (
                  <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {details.runtime} min
                  </span>
                )}

                {/* Nota do TMDB */}
                {details.tmdb_rating && Number(details.tmdb_rating) > 0 && (
                  <span className="tag" style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    color: 'hsl(200 80% 65%)', borderColor: 'rgba(100,180,255,0.2)',
                    background: 'rgba(100,180,255,0.05)', fontWeight: 600,
                  }}>
                    <Star size={12} style={{ fill: 'hsl(200 80% 65%)', color: 'hsl(200 80% 65%)' }} />
                    TMDB: {details.tmdb_rating}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({details.vote_count?.toLocaleString('pt-BR')} votos)
                    </span>
                  </span>
                )}

                {/* Média da comunidade (app) */}
                {communityAvg > 0 && (
                  <span className="tag" style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    color: 'var(--warning)', borderColor: 'rgba(234,179,8,0.2)',
                    background: 'rgba(234,179,8,0.05)', fontWeight: 600,
                  }}>
                    <Star size={12} style={{ fill: 'var(--warning)' }} />
                    Comunidade: {communityAvg.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'voto' : 'votos'})
                  </span>
                )}
              </div>

              <h4 className="modal-overview-title">Sinopse</h4>
              <p className="modal-overview" style={{ marginBottom: 0 }}>
                {details.overview || 'Sinopse indisponível para este título.'}
              </p>
            </div>
          </div>

          {/* Seção extra: Onde assistir & Trailer oficial */}
          {(details.watch_providers?.flatrate?.length > 0 || details.trailer_url) && (
            <div className="modal-extra-section">
              {details.watch_providers?.flatrate?.length > 0 && (
                <div className="providers-container">
                  <h5 className="providers-title">Onde assistir (Brasil)</h5>
                  <div className="providers-list">
                    {details.watch_providers.flatrate.map((provider, idx) => (
                      <div key={idx} className="provider-item" title={provider.name}>
                        {provider.logo && (
                          <img src={provider.logo} alt={provider.name} className="provider-logo" />
                        )}
                        <span>{provider.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {details.trailer_url && (
                <div className="trailer-container">
                  <h4 className="modal-overview-title" style={{ marginBottom: '0.6rem' }}>Trailer Oficial</h4>
                  <div className="trailer-wrapper">
                    <iframe
                      src={details.trailer_url}
                      title="Trailer oficial"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="movie-reviews-section">
            <div>
              <ReviewForm onSubmitReview={handleSubmitReview} isSubmitting={submitting} />
            </div>

            <div className="reviews-separator" />

            <div>
              <h3 className="review-form-title" style={{ marginBottom: '1.2rem' }}>
                <Film size={20} style={{ color: 'var(--accent)' }} />
                <span>Opinião da Comunidade</span>
              </h3>

              {reviews.length > 0 && (
                <div className="ratings-chart" style={{ marginBottom: '1.5rem' }}>
                  <h4 className="chart-title">Distribuição de Avaliações ({reviews.length} {reviews.length === 1 ? 'comentário' : 'comentários'})</h4>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => Math.round(r.rating) === star).length;
                    const pct = (count / reviews.length) * 100;
                    return (
                      <div key={star} className="chart-row">
                        <span className="chart-label">
                          {star} <Star size={12} style={{ fill: 'var(--warning)', color: 'var(--warning)' }} />
                        </span>
                        <div className="chart-bar-bg">
                          <div className="chart-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="chart-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {loadingRevs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }} />
                </div>
              ) : (
                <ReviewList
                  reviews={reviews}
                  currentUser={user}
                  onDeleteReview={handleDeleteReview}
                  onLikeReview={async (reviewId) => {
                    if (!user) {
                      addToast('Faça login para curtir comentários!', 'info');
                      return;
                    }
                    try {
                      const data = await api.post(`/reviews/${reviewId}/like`);
                      setReviews(prev =>
                        prev.map(r =>
                          r.id === reviewId
                            ? { ...r, like_count: data.like_count, liked_by_users: data.liked_by_users }
                            : r
                        )
                      );
                    } catch (err) {
                      addToast('Não foi possível registrar a curtida.', 'error');
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
