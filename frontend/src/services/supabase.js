const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLocalNetwork = hostname.startsWith('192.168.') || 
                           hostname.startsWith('10.') || 
                           hostname.startsWith('172.');
    
    if (envUrl) {
      // Se estamos em produção real (ex: Vercel) mas a URL do build aponta para localhost (configuração padrão),
      // redirecionamos automaticamente para o Render de produção.
      if (!isLocalHost && !isLocalNetwork && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
        return 'https://cinelist-m8q5.onrender.com/api';
      }
      // Se estamos testando na rede local (ex: celular), ajustamos o localhost para o IP do computador
      if (isLocalNetwork && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
        return envUrl.replace(/localhost|127\.0\.0\.1/, hostname);
      }
      return envUrl;
    }
    
    // Se não houver variável VITE_API_URL definida no build:
    if (!isLocalHost && !isLocalNetwork) {
      // Produção ao vivo na Vercel -> aponta para o Render de produção
      return 'https://cinelist-m8q5.onrender.com/api';
    }
    
    // Desenvolvimento local -> aponta para o servidor local na porta 3001
    return `${protocol}//${hostname}:3001/api`;
  }
  
  return envUrl || 'http://localhost:3001/api';
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

// Helper para decodificar o payload de um token JWT no navegador
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
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

    // Atualizar dados do usuário no Express
    async updateUser({ data }) {
      try {
        const session = getLocalSession();
        if (!session || !session.access_token) {
          throw new Error('Sessão expirada ou usuário não autenticado.');
        }

        const response = await fetch(`${API_URL}/auth/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ display_name: data.display_name })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Erro ao atualizar perfil.');
        }

        // Salva a nova sessão no localStorage e notifica os componentes React
        setLocalSession(resData.session);

        return { data: { user: resData.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },

    // Obter sessão atual salva e validar a expiração localmente sem requisições de rede redundantes
    async getSession() {
      const session = getLocalSession();
      if (!session || !session.access_token) {
        return { data: { session: null }, error: null };
      }
      
      const payload = decodeJwt(session.access_token);
      if (!payload) {
        setLocalSession(null);
        return { data: { session: null }, error: null };
      }
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTimestamp > payload.exp) {
        // Token expirado localmente, limpa a sessão
        setLocalSession(null);
        return { data: { session: null }, error: null };
      }
      
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
