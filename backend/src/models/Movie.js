import { supabase } from '../config/supabase.js';

export const Movie = {
  // Obter todos os filmes
  async getAll() {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obter filme específico pelo ID
  async getById(id) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Criar um novo filme (caso queira expandir o catálogo)
  async create(movieData) {
    const { data, error } = await supabase
      .from('movies')
      .insert([
        {
          title: movieData.title,
          overview: movieData.overview,
          poster_url: movieData.poster_url,
          release_date: movieData.release_date,
          genre: movieData.genre
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
