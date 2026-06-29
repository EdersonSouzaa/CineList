import React, { useState, useEffect, useRef } from 'react';
import { Film, Heart, LogOut, User, Gamepad2 } from 'lucide-react';
import { supabase } from '../services/supabase.js';
import iconeApp from '../assets/app_icone.png';

export const Navbar = ({ activeTab, setActiveTab, user, addToast }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      addToast('Sessão encerrada com sucesso!', 'success');
    } catch (error) {
      addToast(`Erro ao sair: ${error.message}`, 'error');
    }
  };

  // Fechar o menu dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <>
      <nav className="navbar glass-panel">
        <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); if (user) setActiveTab('catalog'); }}>
          <img src={iconeApp} alt="CineList Logo" className="nav-logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span>CineList</span>
        </a>

        {user && (
          <>
            {/* Links de navegação exclusivos para Desktop */}
            <div className="nav-links desktop-only">
              <button 
                className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setActiveTab('catalog')}
                style={{ background: 'transparent', border: 'none' }}
              >
                <Film size={18} />
                <span>Catálogo</span>
              </button>
              <button 
                className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
                style={{ background: 'transparent', border: 'none' }}
              >
                <Heart size={18} />
                <span>Favoritos</span>
              </button>
              <button 
                className={`nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
                style={{ background: 'transparent', border: 'none' }}
              >
                <Gamepad2 size={18} />
                <span>CineQuiz</span>
              </button>
              <button 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={{ background: 'transparent', border: 'none' }}
              >
                <User size={18} />
                <span>Perfil</span>
              </button>
            </div>

            {/* Controle de usuário exclusivo para Desktop */}
            <div className="nav-user desktop-only">
              <div className="nav-avatar">
                <User size={16} />
              </div>
              <span className="user-email" title={user.email}>{user.email}</span>
              <button className="btn-signout" onClick={handleSignOut}>
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>

            {/* Controle de usuário exclusivo para Mobile (Avatar + Dropdown) */}
            <div className="mobile-user-control mobile-only" ref={dropdownRef}>
              <button 
                className="mobile-avatar-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {firstLetter}
              </button>
              
              {dropdownOpen && (
                <div className="navbar-dropdown glass-panel fade-in">
                  <div className="dropdown-user-info">
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <button className="dropdown-item signout-item" onClick={() => { setDropdownOpen(false); handleSignOut(); }}>
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Barra de Navegação Inferior exclusiva para Mobile */}
      {user && (
        <div className="mobile-bottom-nav glass-panel mobile-only">
          <button 
            className={`bottom-nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Film size={20} />
            <span>Catálogo</span>
          </button>
          <button 
            className={`bottom-nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={20} />
            <span>Favoritos</span>
          </button>
          <button 
            className={`bottom-nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <Gamepad2 size={20} />
            <span>CineQuiz</span>
          </button>
          <button 
            className={`bottom-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Perfil</span>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
