import { supabase } from './supabase.js';

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

// Auxiliar para obter os cabeçalhos das requisições, injetando o token de sessão do Supabase se disponível
const getHeaders = async () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Erro ao buscar a sessão do Supabase:', error);
  }
  
  return headers;
};

// Auxiliar para tratar a resposta HTTP e deslogar caso o token no backend seja considerado inválido (401)
const handleResponse = async (response, method) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Limpa a sessão no frontend caso o token seja rejeitado pelo Express/Postgres
      supabase.auth.signOut();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na requisição ${method}: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Requisição GET
  async get(endpoint) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return handleResponse(response, 'GET');
  },

  // Requisição POST
  async post(endpoint, body) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(response, 'POST');
  },

  // Requisição DELETE
  async delete(endpoint) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response, 'DELETE');
  }
};
