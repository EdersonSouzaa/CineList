import React, { useState, useEffect } from 'react';
import { getPopularMovies, MOVIE_GENRES } from '../services/tmdb.js';
import { Loader2, Play, Award, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

const QUIZ_LENGTH = 5;

export const CineQuiz = ({ user, addToast }) => {
  const [moviePool, setMoviePool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // 'loading', 'intro', 'playing', 'finished'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Carregar filmes populares do TMDB
  const loadPool = async () => {
    setLoading(true);
    try {
      // Busca as duas primeiras páginas de filmes populares para ter um pool variado (40 filmes)
      const page1 = await getPopularMovies(1);
      const page2 = await getPopularMovies(2);
      const combined = [...page1, ...page2].filter(m => m.overview && m.poster_url && m.release_date && m.genre);
      setMoviePool(combined);
      setLoading(false);
    } catch (err) {
      console.error(err);
      addToast('Não foi possível carregar as perguntas do TMDB.', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPool();
  }, []);

  // Gerar um conjunto de 5 perguntas
  const generateQuestions = () => {
    if (moviePool.length < 10) {
      addToast('Aguarde carregar o catálogo de filmes.', 'info');
      return;
    }

    // Embaralhar o pool de filmes
    const shuffledPool = [...moviePool].sort(() => Math.random() - 0.5);
    const selectedMovies = shuffledPool.slice(0, QUIZ_LENGTH);
    const newQuestions = [];

    selectedMovies.forEach((movie, i) => {
      // Tipos de perguntas:
      // 0 - Ano de Lançamento
      // 1 - Adivinhe o título pela Sinopse
      // 2 - Adivinhe o título pelo Pôster
      // 3 - Adivinhe o Gênero
      const questionType = Math.floor(Math.random() * 4);
      let questionText = '';
      let correctAnswer = '';
      let options = [];
      let extraData = {};

      const distractors = shuffledPool.filter(m => m.id !== movie.id);

      if (questionType === 0) {
        // Ano de lançamento
        const year = new Date(movie.release_date).getFullYear();
        questionText = `Em que ano foi lançado o filme "${movie.title}"?`;
        correctAnswer = String(year);
        
        // Gera 3 anos aleatórios próximos
        const years = new Set([correctAnswer]);
        while (years.size < 4) {
          const randomOffset = Math.floor(Math.random() * 9) - 4; // -4 a +4
          if (randomOffset !== 0) {
            years.add(String(year + randomOffset));
          }
        }
        options = Array.from(years);
      } 
      else if (questionType === 1) {
        // Adivinhar pela Sinopse
        questionText = 'A partir da sinopse abaixo, adivinhe qual é o filme:';
        correctAnswer = movie.title;
        
        // Remove menções ao nome do filme na sinopse para evitar dar a resposta
        let obscuredOverview = movie.overview;
        const escapedTitle = movie.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedTitle, 'gi');
        obscuredOverview = obscuredOverview.replace(regex, '__________');

        extraData = { overview: obscuredOverview };
        
        // 3 distrações
        const titles = new Set([correctAnswer]);
        while (titles.size < 4) {
          titles.add(distractors[Math.floor(Math.random() * distractors.length)].title);
        }
        options = Array.from(titles);
      } 
      else if (questionType === 2) {
        // Adivinhar pelo Pôster
        questionText = 'Qual filme corresponde ao pôster abaixo?';
        correctAnswer = movie.title;
        extraData = { poster_url: movie.poster_url };

        // 3 distrações
        const titles = new Set([correctAnswer]);
        while (titles.size < 4) {
          titles.add(distractors[Math.floor(Math.random() * distractors.length)].title);
        }
        options = Array.from(titles);
      } 
      else {
        // Adivinhar o Gênero
        const mainGenre = movie.genre.split(', ')[0];
        questionText = `Qual é o gênero principal associado ao filme "${movie.title}"?`;
        correctAnswer = mainGenre;

        const allGenres = Object.values(MOVIE_GENRES);
        const genres = new Set([correctAnswer]);
        while (genres.size < 4) {
          genres.add(allGenres[Math.floor(Math.random() * allGenres.length)]);
        }
        options = Array.from(genres);
      }

      // Shufflar as opções
      options = options.sort(() => Math.random() - 0.5);

      newQuestions.push({
        type: questionType,
        questionText,
        correctAnswer,
        options,
        extraData
      });
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setHasAnswered(false);
    setSelectedOption(null);
    setGameState('playing');
  };

  const handleSelectOption = (option) => {
    if (hasAnswered) return;
    setSelectedOption(option);
    setHasAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < QUIZ_LENGTH) {
      setCurrentIndex(prev => prev + 1);
      setHasAnswered(false);
      setSelectedOption(null);
    } else {
      setGameState('finished');
    }
  };

  const getRank = () => {
    if (score === 5) return { title: '🎥 Diretor de Hollywood', desc: 'Conhecimento perfeito! Você domina a sétima arte como um mestre.' };
    if (score >= 3) return { title: '🍿 Crítico de Cinema', desc: 'Muito bom! Suas análises devem ser afiadas. Você realmente entende de filmes.' };
    if (score >= 1) return { title: '🎟️ Cinéfilo Iniciante', desc: 'Bom começo! Você assiste a boas produções, mas ainda tem bastante a descobrir.' };
    return { title: '😴 Dormiu na Sessão', desc: 'Ih... parece que você pegou no sono no meio do filme. Tente novamente!' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Carregando dados das produções...</p>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];
  const rank = getRank();

  return (
    <div className="quiz-container" style={{ maxWidth: '650px', margin: '0 auto', padding: '1rem 0' }}>
      {gameState === 'intro' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent-glow)', padding: '1rem', borderRadius: '50%', color: 'var(--accent)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <Play size={40} style={{ marginLeft: '4px' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>CineQuiz</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Teste seus conhecimentos de cinema! Vamos gerar perguntas dinâmicas usando dados reais do TMDB sobre anos de lançamento, pôsteres, gêneros e sinopses.
          </p>
          <button 
            className="btn-primary" 
            onClick={generateQuestions}
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '14px' }}
          >
            Começar Desafio
          </button>
        </div>
      )}

      {gameState === 'playing' && activeQuestion && (
        <div>
          {/* Status e Progresso */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Pergunta <strong style={{ color: 'var(--text-primary)' }}>{currentIndex + 1}</strong> de {QUIZ_LENGTH}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
              Acertos: {score}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{
              background: 'var(--accent)',
              height: '100%',
              width: `${((currentIndex) / QUIZ_LENGTH) * 100}%`,
              transition: 'width 0.4s ease-out'
            }} />
          </div>

          {/* Pergunta */}
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', borderRadius: '24px', position: 'relative', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.4', textAlign: 'center' }}>
              {activeQuestion.questionText}
            </h3>

            {/* Renderização de mídias extras */}
            {activeQuestion.type === 1 && activeQuestion.extraData.overview && (
              <blockquote style={{
                background: 'rgba(255,255,255,0.02)',
                borderLeft: '4px solid var(--accent)',
                padding: '1rem',
                margin: '1.5rem 0',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                fontStyle: 'italic'
              }}>
                "{activeQuestion.extraData.overview}"
              </blockquote>
            )}

            {activeQuestion.type === 2 && activeQuestion.extraData.poster_url && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
                <img 
                  src={activeQuestion.extraData.poster_url} 
                  alt="Poster da pergunta"
                  style={{
                    height: '240px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glow)'
                  }} 
                />
              </div>
            )}

            {/* Opções */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
              {activeQuestion.options.map((option, idx) => {
                let btnStyle = {
                  width: '100%',
                  padding: '1rem 1.2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: hasAnswered ? 'default' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'var(--transition-smooth)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                };

                if (hasAnswered) {
                  if (option === activeQuestion.correctAnswer) {
                    btnStyle.background = 'rgba(34, 197, 94, 0.15)';
                    btnStyle.borderColor = 'var(--success)';
                    btnStyle.color = '#fff';
                  } else if (option === selectedOption) {
                    btnStyle.background = 'rgba(239, 68, 68, 0.15)';
                    btnStyle.borderColor = 'var(--danger)';
                    btnStyle.color = '#fff';
                  } else {
                    btnStyle.opacity = 0.5;
                  }
                } else {
                  // Efeitos de Hover normais
                  btnStyle[':hover'] = {
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)'
                  };
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    disabled={hasAnswered}
                    style={btnStyle}
                    className={`quiz-option-btn ${!hasAnswered ? 'interactive' : ''} ${
                      hasAnswered
                        ? option === activeQuestion.correctAnswer
                          ? 'correct'
                          : option === selectedOption
                            ? 'incorrect'
                            : 'neutral'
                        : ''
                    }`}
                  >
                    <span>{option}</span>
                    {hasAnswered && option === activeQuestion.correctAnswer && (
                      <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                    )}
                    {hasAnswered && option === selectedOption && option !== activeQuestion.correctAnswer && (
                      <XCircle size={16} style={{ color: 'var(--danger)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão Próximo */}
          {hasAnswered && (
            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <span>{currentIndex + 1 === QUIZ_LENGTH ? 'Ver Resultados' : 'Próxima Pergunta'}</span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {gameState === 'finished' && (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--warning-glow)', padding: '1.2rem', borderRadius: '50%', color: 'var(--warning)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              <Award size={44} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Desafio Concluído!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Você respondeu todas as perguntas.
          </p>

          <div style={{ margin: '2rem 0', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Sua Pontuação</p>
            <h3 style={{ fontSize: '3rem', color: 'var(--accent)', fontWeight: 800, marginBottom: '0.8rem' }}>
              {score} / {QUIZ_LENGTH}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rank.title}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.4' }}>{rank.desc}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={generateQuestions}
              className="btn-primary"
              style={{
                flex: 1,
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <RotateCcw size={16} />
              <span>Jogar Novamente</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CineQuiz;
