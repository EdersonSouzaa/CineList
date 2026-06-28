import React, { useState, useEffect } from 'react';
import { Film, Heart, Gamepad2, User } from 'lucide-react';
import { supabase } from './services/supabase.js';
import Navbar from './components/Navbar.jsx';
import Toast from './components/Toast.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';
import CineQuiz from './pages/CineQuiz.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [toasts, setToasts] = useState([]);

  // Utilitário para adicionar notificações (Toasts)
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Monitorar autenticação do Supabase
  useEffect(() => {
    // 1. Verificar sessão ativa ao iniciar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escutar mudanças de estado de autenticação (Sign In, Sign Out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setActiveTab('catalog'); // Volta para o catálogo padrão caso deslogue
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ fontFamily: 'var(--font-title)', fontWeight: 500 }}>
          Iniciando CineList...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Barra de Navegação Superior */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        addToast={addToast} 
      />

      {/* Conteúdo Principal da Página */}
      <main className="main-content">
        {!user ? (
          <Auth addToast={addToast} />
        ) : activeTab === 'catalog' ? (
          <Dashboard user={user} addToast={addToast} />
        ) : activeTab === 'favorites' ? (
          <Favorites user={user} addToast={addToast} />
        ) : activeTab === 'quiz' ? (
          <CineQuiz user={user} addToast={addToast} />
        ) : (
          <Profile user={user} addToast={addToast} />
        )}
      </main>

      {/* Barra de Navegação Inferior para Mobile */}
      {user && (
        <div className="mobile-bottom-nav glass-panel">
          <button 
            className={`mobile-nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Film size={20} />
            <span>Catálogo</span>
          </button>
          <button 
            className={`mobile-nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={20} />
            <span>Favoritos</span>
          </button>
          <button 
            className={`mobile-nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <Gamepad2 size={20} />
            <span>CineQuiz</span>
          </button>
          <button 
            className={`mobile-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Perfil</span>
          </button>
        </div>
      )}

      {/* Container de Toasts (Notificações Flutuantes) */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
