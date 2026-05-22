import React from 'react';
import { Film, Heart, LogOut, User, Gamepad2 } from 'lucide-react';
import { supabase } from '../services/supabase.js';
import iconeApp from '../assets/app_icone.png';

export const Navbar = ({ activeTab, setActiveTab, user, addToast }) => {
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      addToast('Sessão encerrada com sucesso!', 'success');
    } catch (error) {
      addToast(`Erro ao sair: ${error.message}`, 'error');
    }
  };

  return (
    <nav className="navbar glass-panel">
      <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); if (user) setActiveTab('catalog'); }}>
        <img src={iconeApp} alt="CineList Logo" className="nav-logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <span>CineList</span>
      </a>

      {user && (
        <>
          <div className="nav-links">
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

          <div className="nav-user">
            <span className="user-email" title={user.email}>{user.email}</span>
            <button className="btn-signout" onClick={handleSignOut}>
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
