import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';

export const ReviewForm = ({ onSubmitReview, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    onSubmitReview({ rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3 className="review-form-title">
        <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
        <span>Deixe sua Avaliação</span>
      </h3>

      <div className="comment-input-wrapper">
        <span className="comment-label">Sua Nota</span>
        <div className="star-rating-selector">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <button
                type="button"
                key={ratingValue}
                className={`star-btn ${ratingValue <= (hover || rating) ? 'active' : ''}`}
                onClick={() => setRating(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
                title={`${ratingValue} Estrela(s)`}
              >
                <Star size={24} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="comment-input-wrapper">
        <label className="comment-label" htmlFor="review-comment">Seu Comentário</label>
        <textarea
          id="review-comment"
          className="comment-textarea"
          placeholder="O que achou deste filme? Comente sobre os pontos fortes, roteiro, atuação..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
        />
      </div>

      <button 
        type="submit" 
        className="btn-submit-review"
        disabled={rating === 0 || isSubmitting}
      >
        {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
      </button>
    </form>
  );
};

export default ReviewForm;
