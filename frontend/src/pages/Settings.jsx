import React, { useState, useEffect } from 'react';
import { User, Palette, Globe, ShieldAlert, Download, Info, Check, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase.js';

// Função para aplicar a cor do tema dinamicamente no documento
export const applyThemeColor = (colorName) => {
  const themes = {
    gold: {
      accent: '#ffb800',
      accentHover: '#e0a200',
      accentGlow: 'rgba(255, 184, 0, 0.15)',
    },
    cyan: {
      accent: '#06b6d4',
      accentHover: '#0891b2',
      accentGlow: 'rgba(6, 182, 212, 0.15)',
    },
    red: {
      accent: '#ff3b30',
      accentHover: '#e03228',
      accentGlow: 'rgba(255, 59, 48, 0.15)',
    },
    green: {
      accent: '#34c759',
      accentHover: '#28a745',
      accentGlow: 'rgba(52, 199, 89, 0.15)',
    }
  };

  const selected = themes[colorName] || themes.gold;
  document.documentElement.style.setProperty('--accent', selected.accent);
  document.documentElement.style.setProperty('--accent-hover', selected.accentHover);
  document.documentElement.style.setProperty('--accent-glow', selected.accentGlow);
  localStorage.setItem('cinelist_theme', colorName);
};

export const Settings = ({ user, addToast }) => {
  // Configurações do perfil
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Configurações locais
  const [theme, setTheme] = useState(localStorage.getItem('cinelist_theme') || 'gold');
  const [language, setLanguage] = useState(localStorage.getItem('cinelist_language') || 'pt-BR');
  const [includeAdult, setIncludeAdult] = useState(localStorage.getItem('cinelist_include_adult') === 'true');

  // Estado de instalação do PWA
  const [installable, setInstallable] = useState(!!window.deferredPrompt);

  useEffect(() => {
    const handleInstallable = () => {
      setInstallable(true);
    };
    window.addEventListener('pwa-installable', handleInstallable);
    return () => window.removeEventListener('pwa-installable', handleInstallable);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('O nome não pode estar vazio.', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() }
      });

      if (error) throw error;
      addToast('Nome de exibição atualizado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Erro ao atualizar o perfil.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleThemeChange = (colorName) => {
    setTheme(colorName);
    applyThemeColor(colorName);
    addToast('Cor do tema atualizada!', 'success');
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    localStorage.setItem('cinelist_language', lang);
    addToast('Idioma do catálogo atualizado!', 'success');
  };

  const handleAdultToggle = (e) => {
    const checked = e.target.checked;
    setIncludeAdult(checked);
    localStorage.setItem('cinelist_include_adult', String(checked));
    addToast(checked ? 'Conteúdo adulto ativado.' : 'Conteúdo adulto desativado.', 'info');
  };

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      addToast('Prompt de instalação não disponível no momento.', 'info');
      return;
    }
    promptEvent.prompt();
    try {
      const { outcome } = await promptEvent.userChoice;
      console.log(`Instalação do PWA: ${outcome}`);
      window.deferredPrompt = null;
      setInstallable(false);
      addToast('Processando instalação...', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-container">
      <h2 className="settings-page-title">Configurações</h2>

      <div className="settings-sections">
        {/* Instalar App (PWA) */}
        {installable && (
          <div className="settings-card glass-panel highlight-border">
            <div className="settings-card-header">
              <Download size={22} style={{ color: 'var(--accent)' }} />
              <div>
                <h3>CineList no Celular</h3>
                <p>Baixe o aplicativo para ter carregamento instantâneo e acesso offline!</p>
              </div>
            </div>
            <button className="btn-primary btn-install-pwa" onClick={handleInstallClick} style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
              Instalar Aplicativo (PWA)
            </button>
          </div>
        )}

        {/* Perfil */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <User size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Perfil da Conta</h3>
              <p>Gerencie seus dados públicos cadastrados</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="settings-form" style={{ marginTop: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">E-mail (Leitura)</label>
              <input type="text" className="form-input disabled" value={user?.email || ''} readOnly disabled />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-username">Nome de Exibição</label>
              <input
                id="settings-username"
                type="text"
                className="form-input"
                placeholder="Seu nome"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit-review" disabled={updatingProfile} style={{ width: 'auto', alignSelf: 'flex-start', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {updatingProfile ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Atualizar Perfil</span>
              )}
            </button>
          </form>
        </div>

        {/* Aparência */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Palette size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Aparência do CineList</h3>
              <p>Personalize a cor de destaque da interface</p>
            </div>
          </div>
          <div className="theme-selectors" style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'gold', name: 'Dourado', color: '#ffb800' },
              { id: 'cyan', name: 'Ciano', color: '#06b6d4' },
              { id: 'red', name: 'Vermelho', color: '#ff3b30' },
              { id: 'green', name: 'Verde', color: '#34c759' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleThemeChange(item.id)}
                className={`theme-color-option ${theme === item.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.2rem',
                  borderRadius: '12px',
                  border: theme === item.id ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                  background: theme === item.id ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                <span>{item.name}</span>
                {theme === item.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros e Idioma */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Globe size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Preferências de Conteúdo</h3>
              <p>Ajuste os filtros de listagem do catálogo de filmes</p>
            </div>
          </div>
          <div className="settings-options" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.2rem' }}>
            <div className="settings-option-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Idioma do Catálogo</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Idioma dos títulos e descrições dos filmes (TMDB)</p>
              </div>
              <select className="filter-select" value={language} onChange={handleLanguageChange} style={{ width: '150px' }}>
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">Inglês (US)</option>
              </select>
            </div>

            <div className="settings-option-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Filtro de Conteúdo Adulto (+18)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Exibir filmes e produções adultas nas buscas e recomendações</p>
              </div>
              <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeAdult}
                  onChange={handleAdultToggle}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="toggle-slider" style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: '34px',
                  background: includeAdult ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  transition: '.3s'
                }}>
                  <span className="toggle-circle" style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px', width: '18px',
                    left: includeAdult ? '24px' : '3px',
                    bottom: '3px',
                    borderRadius: '50%',
                    background: includeAdult ? '#08090f' : 'var(--text-secondary)',
                    transition: '.3s'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Sobre */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Info size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Sobre o CineList</h3>
              <p>Detalhes do aplicativo e tecnologias</p>
            </div>
          </div>
          <div className="about-info" style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p><strong>CineList v2.0.0 (PWA)</strong></p>
            <p>Seu assistente pessoal e catálogo de cinema moderno. Salve seus filmes preferidos, avalie produções da comunidade, descubra streaming oficial e teste seus conhecimentos com o CineQuiz!</p>
            <p style={{ marginTop: '0.8rem', color: 'var(--text-muted)' }}>Desenvolvido com React + Supabase + OpenStreetMap + TMDB API.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
