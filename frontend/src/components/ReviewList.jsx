import React from 'react';
import { Star, Trash2 } from 'lucide-react';

export const ReviewList = ({ reviews, currentUser, onDeleteReview }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="no-reviews">Nenhuma avaliação ainda para este filme. Seja o primeiro a comentar!</p>;
  }

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
            {review.comment && <p className="review-comment">{review.comment}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
