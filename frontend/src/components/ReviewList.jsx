import React, { useState } from 'react';
import { Star, Trash2, Heart, Eye } from 'lucide-react';

export const ReviewList = ({ reviews, currentUser, onDeleteReview, onLikeReview }) => {
  const [revealedReviewIds, setRevealedReviewIds] = useState([]);

  if (!reviews || reviews.length === 0) {
    return <p className="no-reviews">Nenhuma avaliação ainda para este filme. Seja o primeiro a comentar!</p>;
  }

  const toggleRevealSpoiler = (id) => {
    setRevealedReviewIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Data indisponível';
    }
  };

  return (
    <div className="reviews-list-container">
      {reviews.map((review) => {
        // Verifica se a avaliação pertence ao usuário atualmente logado
        const isOwner = currentUser && currentUser.id === review.user_id;
        const hasLiked = currentUser && review.liked_by_users?.includes(currentUser.id);
        const showSpoilerWarning = review.is_spoiler && !revealedReviewIds.includes(review.id);

        return (
          <div key={review.id} className="review-item">
            <div className="review-item-header">
              <div className="review-user-info">
                <span className="reviewer-name" title={review.user_email}>
                  {review.user_email.split('@')[0]} {/* Exibe apenas a parte inicial do e-mail por estética */}
                </span>
                <span className="review-date">{formatDate(review.created_at)}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div className="review-item-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      style={{ 
                        fill: i < review.rating ? 'var(--warning)' : 'transparent',
                        color: i < review.rating ? 'var(--warning)' : 'var(--text-muted)' 
                      }} 
                    />
                  ))}
                </div>

                {isOwner && (
                  <button 
                    className="btn-delete-review"
                    onClick={() => onDeleteReview(review.id)}
                    title="Excluir meu comentário"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {review.comment && (
              showSpoilerWarning ? (
                <div 
                  className="spoiler-warning" 
                  onClick={() => toggleRevealSpoiler(review.id)}
                  style={{
                    padding: '1rem',
                    margin: '0.6rem 0',
                    borderRadius: '12px',
                    border: '1px dashed var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textAlign: 'center',
                    background: 'rgba(244, 63, 94, 0.04)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ⚠️ ESTE COMENTÁRIO CONTÉM SPOILERS
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Clique para revelar a crítica.
                  </span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <p className="review-comment">{review.comment}</p>
                  {review.is_spoiler && (
                    <button 
                      onClick={() => toggleRevealSpoiler(review.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        marginTop: '0.3rem',
                        padding: 0,
                        display: 'block'
                      }}
                    >
                      Ocultar crítica
                    </button>
                  )}
                </div>
              )
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.4rem' }}>
              <button
                className={`review-like-btn ${hasLiked ? 'liked' : ''}`}
                onClick={() => onLikeReview && onLikeReview(review.id)}
                title={hasLiked ? "Remover curtida" : "Curtir comentário"}
              >
                <Heart size={14} />
                <span>{review.like_count || 0}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
