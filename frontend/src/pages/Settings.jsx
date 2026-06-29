import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, Globe, ShieldAlert, Download, Info, Check, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase.js';

// Função para aplicar a cor do tema dinamicamente no documento
export const applyThemeColor = (themeMode) => {
  const isLight = themeMode === 'light';
  if (isLight) {
    document.documentElement.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
  }
  localStorage.setItem('cinelist_theme', themeMode);
};

export const Settings = ({ user, addToast }) => {
  // Configurações do perfil
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Configurações locais (modo claro/escuro)
  const [theme, setTheme] = useState(localStorage.getItem('cinelist_theme') === 'light' ? 'light' : 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('cinelist_language') || 'pt-BR');
  const [includeAdult, setIncludeAdult] = useState(localStorage.getItem('cinelist_include_adult') === 'true');

  // Estado de instalação do PWA
  const [installable, setInstallable] = useState(!!window.deferredPrompt);
  const [showInstructions, setShowInstructions] = useState(false);

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

  const handleThemeChange = (mode) => {
    setTheme(mode);
    applyThemeColor(mode);
    addToast(mode === 'light' ? 'Modo Claro ativado!' : 'Modo Escuro ativado!', 'success');
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
      setShowInstructions(prev => !prev);
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isiOS) {
        addToast('Instruções de instalação para iOS exibidas abaixo.', 'info');
      } else {
        addToast('Instruções de instalação exibidas abaixo.', 'info');
      }
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
        <div className="settings-card glass-panel highlight-border">
          <div className="settings-card-header">
            <Download size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Instalar CineList (PWA)</h3>
              <p>Baixe o aplicativo para ter carregamento instantâneo, ícone na tela inicial e acesso offline!</p>
            </div>
          </div>
          <button 
            className="btn-primary btn-install-pwa" 
            onClick={handleInstallClick} 
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              padding: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Download size={18} />
            <span>Baixar Aplicativo (PWA)</span>
          </button>

          {showInstructions && (
            <div className="pwa-instructions-banner" style={{
              marginTop: '1.2rem',
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.9rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} />
                <span>Como instalar o aplicativo:</span>
              </h4>
              {/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ? (
                <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <li>Toque no botão de <strong>Compartilhar</strong> <span role="img" aria-label="share">📤</span> no menu inferior do Safari.</li>
                  <li>Desça a lista de opções e clique em <strong>Adicionar à Tela de Início</strong> <span role="img" aria-label="add to home">➕</span>.</li>
                  <li>Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.</li>
                </ol>
              ) : (
                <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <li>Abra as configurações do seu navegador (ícone de <strong>três pontos</strong> <span role="img" aria-label="menu">⋮</span>).</li>
                  <li>Selecione a opção <strong>Instalar Aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                  <li>Siga as instruções na tela para concluir a instalação.</li>
                </ol>
              )}
            </div>
          )}
        </div>

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

        {/* Tema do CineList */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Sun size={22} style={{ color: 'var(--accent)' }} />
            <div>
              <h3>Tema do CineList</h3>
              <p>Selecione o modo de visualização preferido</p>
            </div>
          </div>
          <div className="theme-selectors" style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'dark', name: 'Modo Escuro', icon: Moon },
              { id: 'light', name: 'Modo Claro', icon: Sun }
            ].map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleThemeChange(item.id)}
                  className={`theme-color-option ${theme === item.id ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: theme === item.id ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    background: theme === item.id ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <IconComponent size={16} style={{ color: theme === item.id ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <span>{item.name}</span>
                  {theme === item.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
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
