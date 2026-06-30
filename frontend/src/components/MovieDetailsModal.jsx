import React, { useState, useEffect } from 'react';
import { X, Calendar, Film, Star, Clock, Tv, Lightbulb, MapPin } from 'lucide-react';
import { api } from '../services/api.js';
import { getDetails } from '../services/tmdb.js';
import ReviewForm from './ReviewForm.jsx';
import ReviewList from './ReviewList.jsx';

// Dataset de locações de cenas famosas para filmes populares
const FAMOUS_LOCATIONS = {
  // Inception (A Origem)
  'movie_27205': {
    title: 'Paris, França',
    scene: 'Ponte de Bir-Hakeim',
    description: 'A icônica cena em que Ariadne descobre como manipular a arquitetura dos sonhos de Paris foi filmada na famosa Ponte de Bir-Hakeim, próxima à Torre Eiffel.',
    lat: 48.855,
    lon: 2.301
  },
  // The Matrix
  'movie_603': {
    title: 'Sydney, Austrália',
    scene: 'Martin Place (Mulher de Vermelho)',
    description: 'A famosa cena de treinamento da simulação com a mulher de vestido vermelho foi filmada na fonte de Martin Place, no coração financeiro de Sydney.',
    lat: -33.868,
    lon: 151.211
  },
  // Lord of the Rings: The Fellowship of the Ring
  'movie_120': {
    title: 'Matamata, Nova Zelândia',
    scene: 'Hobbiton (Condado dos Hobbits)',
    description: 'A pitoresca vila dos Hobbits, o Condado, foi inteiramente construída em uma fazenda real na região de Matamata. Hoje é um ponto turístico preservado.',
    lat: -37.810,
    lon: 175.761
  },
  // Harry Potter and the Philosopher's Stone
  'movie_671': {
    title: 'Londres, Reino Unido',
    scene: 'Estação King\'s Cross (Plataforma 9 ¾)',
    description: 'A famosa passagem secreta para embarcar no Expresso de Hogwarts fica localizada na movimentada estação de trens King\'s Cross em Londres, onde há um ponto turístico oficial.',
    lat: 51.532,
    lon: -0.126
  },
  // Joker (Coringa)
  'movie_475557': {
    title: 'Bronx, Nova York, EUA',
    scene: 'Escadarias do Shakespeare Ave',
    description: 'A escadaria pública localizada na 1165 Shakespeare Ave no Bronx se tornou mundialmente famosa após a cena em que Arthur Fleck desce dançando vestido como Coringa.',
    lat: 40.844,
    lon: -73.923
  },
  // Star Wars: Episode IV
  'movie_11': {
    title: 'Tataouine, Tunísia',
    scene: 'Hotel Sidi Driss (Lar dos Lars)',
    description: 'O planeta desértico Tatooine recebeu este nome por causa da cidade real de Tataouine na Tunísia. O lar subterrâneo de Luke foi filmado neste tradicional hotel berbere.',
    lat: 32.788,
    lon: 10.451
  },
  // Forrest Gump
  'movie_13': {
    title: 'Savannah, Geórgia, EUA',
    scene: 'Chippewa Square (Banco de Forrest)',
    description: 'O famoso banco onde Forrest Gump conta sua história com uma caixa de chocolates ficava na praça Chippewa Square. Hoje, o banco original está exposto no Museu de História de Savannah.',
    lat: 32.076,
    lon: -81.093
  },
  // The Dark Knight
  'movie_155': {
    title: 'Chicago, Illinois, EUA',
    scene: 'Lower Wacker Drive',
    description: 'A espetacular perseguição no subsolo de Gotham City foi filmada nas ruas de nível inferior de Wacker Drive em Chicago, conhecidas por seu visual industrial cinzento.',
    lat: 41.882,
    lon: -87.627
  },
  // Breaking Bad
  'tv_1396': {
    title: 'Albuquerque, Novo México, EUA',
    scene: 'Casa de Walter White',
    description: 'A residência real de Walter White e sua família fica em Albuquerque. É um dos locais de filmagem mais visitados por fãs de séries, embora seja uma propriedade privada.',
    lat: 35.120,
    lon: -106.529
  },
  // Game of Thrones
  'tv_1399': {
    title: 'Dubrovnik, Croácia',
    scene: 'Porto de King\'s Landing',
    description: 'A cidade histórica muralhada de Dubrovnik serviu como o principal cenário de King\'s Landing, a capital de Westeros, ostentando praias rochosas e fortalezas medievais.',
    lat: 42.641,
    lon: 18.110
  }
};

// Coordenadas aproximadas para países de produção (Fallback)
const COUNTRY_COORDINATES = {
  'US': { name: 'Estados Unidos', lat: 37.090, lon: -95.712, desc: 'Esta produção foi realizada nos estúdios e locações espalhados pelos Estados Unidos.' },
  'GB': { name: 'Reino Unido', lat: 55.378, lon: -3.436, desc: 'As locações e filmagens desta obra foram rodadas no Reino Unido.' },
  'BR': { name: 'Brasil', lat: -14.235, lon: -51.925, desc: 'Esta obra nacional foi produzida e filmada no Brasil.' },
  'FR': { name: 'França', lat: 46.227, lon: 2.213, desc: 'As belas paisagens ou estúdios franceses foram palco para esta produção.' },
  'JP': { name: 'Japão', lat: 36.204, lon: 138.252, desc: 'Esta produção de animação ou live-action foi desenvolvida ou ambientada no Japão.' },
  'CA': { name: 'Canadá', lat: 56.130, lon: -106.346, desc: 'Esta obra utilizou estúdios e locações naturais no Canadá.' },
  'DE': { name: 'Alemanha', lat: 51.165, lon: 10.451, desc: 'Estúdios históricos e cenários alemães fizeram parte da produção.' },
  'IT': { name: 'Itália', lat: 41.871, lon: 12.567, desc: 'O charme italiano serviu de cenário ou inspiração para este projeto.' },
  'ES': { name: 'Espanha', lat: 40.463, lon: -3.749, desc: 'Cenários e produção localizados na Espanha integraram esta obra.' },
  'NZ': { name: 'Nova Zelândia', lat: -40.900, lon: 174.886, desc: 'As deslumbrantes paisagens da Nova Zelândia serviram de locação.' },
  'AU': { name: 'Austrália', lat: -25.274, lon: 133.775, desc: 'Esta obra contou com gravações ou pós-produção na Austrália.' },
  'KR': { name: 'Coreia do Sul', lat: 35.907, lon: 127.766, desc: 'Esta grande produção é de origem e ambientação na Coreia do Sul.' },
  'IN': { name: 'Índia', lat: 20.593, lon: 78.962, desc: 'A vibrante indústria de cinema da Índia produziu esta grande obra.' }
};

export const MovieDetailsModal = ({ movie, user, onClose, addToast, onReviewAdded }) => {
  const [details, setDetails]         = useState(movie);
  const [reviews, setReviews]         = useState([]);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [cinemaMode, setCinemaMode]   = useState(false);

  // Busca detalhes completos do TMDB (gêneros por nome, runtime, tagline)
  useEffect(() => {
    if (movie.tmdb_id && movie.media_type) {
      getDetails(movie.tmdb_id, movie.media_type)
        .then(d => setDetails(d))
        .catch(() => setDetails(movie));
    }
    fetchReviews();
  }, [movie.id]);

  // Extração dinámica da cor do pôster (Efeito Camaleão)
  useEffect(() => {
    const posterUrl = details.poster_url;
    if (!posterUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;

        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          if (a > 200) { //ignora transparência
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }

        if (count > 0) {
          const avgR = Math.round(rSum / count);
          const avgG = Math.round(gSum / count);
          const avgB = Math.round(bSum / count);

          // Insere variáveis de cor dinâmica no documento
          document.documentElement.style.setProperty('--chameleon-color', `${avgR}, ${avgG}, ${avgB}`);
          // Gera um tom de destaque ligeiramente mais brilhante para contraste
          const brightnessOffset = 40;
          const accR = Math.min(255, avgR + brightnessOffset);
          const accG = Math.min(255, avgG + brightnessOffset);
          const accB = Math.min(255, avgB + brightnessOffset);
          document.documentElement.style.setProperty('--chameleon-color-accent', `${accR}, ${accG}, ${accB}`);
        }
      } catch (e) {
        console.warn('Erro ao processar cores dinâmicas:', e);
      }
    };
    img.src = posterUrl;

    return () => {
      // Reseta cores quando a modal fecha
      document.documentElement.style.removeProperty('--chameleon-color');
      document.documentElement.style.removeProperty('--chameleon-color-accent');
    };
  }, [details.poster_url]);

  const fetchReviews = async () => {
    setLoadingRevs(true);
    try {
      const data = await api.get(`/reviews/${encodeURIComponent(movie.id)}`);
      setReviews(data);
    } catch {
      // silencioso
    } finally {
      setLoadingRevs(false);
    }
  };

  const handleSubmitReview = async ({ rating, comment, is_spoiler }) => {
    setSubmitting(true);
    try {
      const newReview = await api.post('/reviews', {
        movie_id: movie.id,
        rating,
        comment,
        is_spoiler,
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

  // Cálculo das informações do CineMap
  const getMapData = () => {
    if (FAMOUS_LOCATIONS[movie.id]) {
      return {
        ...FAMOUS_LOCATIONS[movie.id],
        isCurated: true
      };
    }
    
    if (details.production_countries && details.production_countries.length > 0) {
      const countryIso = details.production_countries[0].iso_3166_1;
      const coord = COUNTRY_COORDINATES[countryIso];
      if (coord) {
        return {
          title: coord.name,
          scene: `Estúdio / Locações em ${coord.name}`,
          description: coord.desc,
          lat: coord.lat,
          lon: coord.lon,
          isCurated: false
        };
      }
    }
    
    return {
      title: 'Hollywood, Los Angeles, EUA',
      scene: 'Estúdios de Hollywood',
      description: 'Como nenhuma locação específica de cena foi mapeada, mostramos a capital mundial do cinema, de onde a magia se espalha.',
      lat: 34.0928,
      lon: -118.3287,
      isCurated: false
    };
  };

  const mapData = getMapData();
  const delta = 0.015;
  const minLon = mapData.lon - delta;
  const minLat = mapData.lat - delta;
  const maxLon = mapData.lon + delta;
  const maxLat = mapData.lat + delta;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${mapData.lat}%2C${mapData.lon}`;

  const isTV = details.media_type === 'tv';

  return (
    <div className={`modal-overlay ${cinemaMode ? 'cinema-mode-active' : ''}`} onClick={onClose}>
      <div className={`modal-content glass-panel ${cinemaMode ? 'cinema-mode-active' : ''}`} onClick={e => e.stopPropagation()}>
        
        {/* Switch do Modo Cinema */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '4.5rem', display: 'flex', gap: '0.5rem', zIndex: 100 }}>
          <button 
            className={`btn-cinema-mode ${cinemaMode ? 'active' : ''}`} 
            onClick={() => setCinemaMode(!cinemaMode)} 
            title={cinemaMode ? "Desativar Modo Cinema" : "Ativar Modo Cinema"}
            style={{
              background: cinemaMode ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: cinemaMode ? '#000' : 'var(--text-primary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Lightbulb size={18} style={{ fill: cinemaMode ? '#000' : 'none' }} />
          </button>
        </div>

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
                e.target.onerror = null;
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

          {/* Seção CineMap (Feature 20) */}
          <div className="cinemap-section" style={{ padding: '0 2.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 className="modal-overview-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
              <MapPin size={18} style={{ color: 'var(--accent)' }} />
              <span>CineMap — {mapData.isCurated ? 'Cenas Famosas' : 'País de Produção'}</span>
            </h4>
            
            <div className="cinemap-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.2rem', fontWeight: 600 }}>{mapData.scene}</h5>
                <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>📍 {mapData.title}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{mapData.description}</p>
              </div>
              
              <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe
                  className="cinemap-iframe"
                  src={mapUrl}
                  title="Locação de cena"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                ></iframe>
              </div>
            </div>
          </div>

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
