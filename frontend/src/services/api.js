import { supabase } from './supabase.js';

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Se a variável de ambiente estiver definida no build (ex: em produção), usamos ela diretamente
  if (envUrl) {
    return envUrl;
  }
  
  // Caso contrário, determinamos a URL dinamicamente com base no dispositivo que está acessando
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Se estivermos acessando por IP local ou localhost, apontamos para a porta 3001 no mesmo host.
    return `${protocol}//${hostname}:3001/api`;
  }
  
  return 'http://localhost:3001/api';
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

export const api = {
  // Requisição GET
  async get(endpoint) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição GET: ${response.status}`);
    }
    return response.json();
  },

  // Requisição POST
  async post(endpoint, body) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição POST: ${response.status}`);
    }
    return response.json();
  },

  // Requisição DELETE
  async delete(endpoint) {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição DELETE: ${response.status}`);
    }
    return response.json();
  }
};
