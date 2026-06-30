// Mock do cliente Supabase para rodar 100% localmente no Express
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Se a variável estiver definida e NÃO apontar para localhost (ou se estiver rodando localmente)
  if (envUrl && (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') || isLocalHost)) {
    return envUrl;
  }
  // Se estiver em produção, aponta diretamente para o backend do Render
  if (typeof window !== 'undefined' && !isLocalHost) {
    return 'https://cinelist-m8q5.onrender.com/api';
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

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

    // Obter sessão atual salva e validar
    async getSession() {
      const session = getLocalSession();
      if (!session || !session.access_token) {
        return { data: { session: null }, error: null };
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Token inválido ou expirado');
        }
        
        const userData = await response.json();
        
        // Atualiza a sessão com dados frescos do usuário
        const updatedSession = {
          ...session,
          user: {
            ...session.user,
            ...userData
          }
        };
        
        setLocalSession(updatedSession);
        return { data: { session: updatedSession }, error: null };
      } catch (error) {
        // Se a validação falhar, limpa a sessão local
        setLocalSession(null);
        return { data: { session: null }, error: null };
      }
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
