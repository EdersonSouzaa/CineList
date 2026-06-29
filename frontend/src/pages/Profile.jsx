import React, { useState, useEffect } from 'react';
import { User, Star, Heart, MessageSquare, Film, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../services/api.js';
import { getDetails } from '../services/tmdb.js';
import MovieDetailsModal from '../components/MovieDetailsModal.jsx';

export const Profile = ({ user, addToast, setActiveTab }) => {
  const [reviews, setReviews] = useState([]);
  const [favCount, setFavCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // 1. Buscar total de favoritos
      const favs = await api.get('/favorites');
      setFavCount(favs.length);

      // 2. Buscar avaliações do próprio usuário
      const reviewsData = await api.get('/reviews/me');

      // 3. Enriquecer avaliações com dados do TMDB
      const enriched = await Promise.allSettled(
        reviewsData.map(async (rev) => {
          const movieId = String(rev.movie_id);
          const [mediaType, tmdbId] = movieId.split('_');
          if (!tmdbId) return rev;

          try {
            const tmdbData = await getDetails(Number(tmdbId), mediaType);
            return {
              ...rev,
              movieTitle: tmdbData.title,
              moviePoster: tmdbData.poster_url,
              movieDetails: tmdbData
            };
          } catch {
            return {
              ...rev,
              movieTitle: `Filme/Série (ID: ${movieId})`
            };
          }
        })
      );

      const validReviews = enriched
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean);

      setReviews(validReviews);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar dados do perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="no-data-card glass-panel" style={{ padding: '6rem 2rem' }}>
        <User size={48} style={{ color: 'var(--accent)', strokeWidth: 1.5 }} />
        <h3>Faça login para ver seu perfil</h3>
        <p>Acesse sua conta para ver suas estatísticas e histórico de comentários!</p>
      </div>
    );
  }

  // Estatísticas
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
  const userName = user.email ? user.email.split('@')[0] : 'Usuário';

  return (
    <div className="profile-container">
      {/* Card de Informações Principais */}
      <div className="profile-card" style={{ position: 'relative' }}>
        <button
          onClick={() => setActiveTab('settings')}
          title="Configurações"
          className="profile-settings-btn"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
            zIndex: 10
          }}
        >
          <SettingsIcon size={18} />
        </button>
        <div className="profile-header">
          <div className="profile-avatar-large">
            {userInitial}
          </div>
          <div className="profile-user-info">
            <h2>Olá, {userName}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        {/* Grade de Estatísticas */}
        <div className="profile-stats">
          <div className="profile-stat-card">
            <div className="stat-val">{favCount}</div>
            <div className="stat-label">Favoritos</div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-val">{totalReviews}</div>
            <div className="stat-label">Avaliações</div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-val">
              {avgRating > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                  {avgRating.toFixed(1)}
                  <Star size={20} style={{ fill: 'var(--warning)', color: 'var(--warning)' }} />
                </span>
              ) : '0.0'}
            </div>
            <div className="stat-label">Nota Média</div>
          </div>
        </div>
      </div>

      {/* Histórico de Comentários */}
      <h3 className="profile-history-title">Meu Histórico de Comentários</h3>

      {loading ? (
        <div className="loading-container" style={{ minHeight: '200px' }}>
          <div className="spinner" />
          <p>Carregando histórico...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="no-data-card glass-panel" style={{ padding: '4rem 2rem' }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)' }} />
          <h3>Nenhum comentário feito ainda</h3>
          <p>Comece a avaliar os títulos do catálogo para compor seu histórico!</p>
        </div>
      ) : (
        <div className="profile-reviews-list">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="profile-review-card glass-panel"
              onClick={() => rev.movieDetails && setSelectedMovie(rev.movieDetails)}
              title="Clique para ver detalhes do filme"
            >
              <div style={{ display: 'flex', gap: '1.2rem' }}>
                {rev.moviePoster ? (
                  <img
                    src={rev.moviePoster}
                    alt={rev.movieTitle}
                    style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                  />
                ) : (
                  <div style={{ width: '60px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Film size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="profile-review-header">
                    <span className="profile-review-title">{rev.movieTitle}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} /> {formatDate(rev.created_at)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.3rem 0' }}>
                    <div style={{ display: 'flex', color: 'var(--warning)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          style={{
                            fill: i < rev.rating ? 'var(--warning)' : 'transparent',
                            color: i < rev.rating ? 'var(--warning)' : 'var(--text-muted)'
                          }}
                        />
                      ))}
                    </div>

                    {rev.like_count > 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Heart size={12} style={{ fill: 'var(--danger)' }} /> {rev.like_count}
                      </span>
                    )}
                  </div>

                  <p className="review-comment" style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    {rev.comment || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Sem comentário escrito</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          user={user}
          onClose={() => setSelectedMovie(null)}
          addToast={addToast}
          onReviewAdded={loadProfileData}
        />
      )}
    </div>
  );
};

export default Profile;
