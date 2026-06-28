// Mock do cliente Supabase para rodar 100% localmente no Express
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Armazena listeners do AuthStateChange
const listeners = new Set();

// Helper para ler a sessão do localStorage
function getLocalSession() {
  try {
    const sessionStr = localStorage.getItem('cinelist_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch {
    return null;
  }
}

// Helper para salvar a sessão e notificar componentes React
function setLocalSession(session) {
  if (session) {
    localStorage.setItem('cinelist_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('cinelist_session');
  }
  // Dispara evento para todos os listeners cadastrados
  listeners.forEach(callback => {
    try {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    } catch (e) {
      console.error('Erro no callback de autenticação:', e);
    }
  });
}

export const supabase = {
  auth: {
    // Cadastro de usuário redirecionado ao Express
    async signUp({ email, password, options }) {
      try {
        const displayName = options?.data?.display_name || '';
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, display_name: displayName })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro no cadastro.');
        }

        // Salva a sessão localmente
        setLocalSession(data.session);

        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    // Login de usuário redirecionado ao Express
    async signInWithPassword({ email, password }) {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro no login.');
        }

        // Salva a sessão localmente
        setLocalSession(data.session);

        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    // Logout limpando o localStorage
    async signOut() {
      try {
        setLocalSession(null);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },

    // Obter sessão atual salva
    async getSession() {
      const session = getLocalSession();
      return { data: { session }, error: null };
    },

    // Monitorar login/logout
    onAuthStateChange(callback) {
      listeners.add(callback);
      
      // Envia a sessão atual imediatamente ao cadastrar
      const session = getLocalSession();
      callback(session ? 'SIGNED_IN' : 'INITIAL_SESSION', session);

      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            }
          }
        }
      };
    }
  }
};
