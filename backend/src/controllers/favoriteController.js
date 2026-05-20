import { Favorite } from '../models/Favorite.js';

// Listar todos os favoritos do usuário autenticado
export const getFavorites = async (req, res) => {
  const user_id = req.user.id;
  try {
    const favorites = await Favorite.getByUserId(user_id, req.supabase);
    res.json(favorites);
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({ error: 'Erro ao carregar sua biblioteca de favoritos.' });
  }
};

// Adicionar filme aos favoritos
export const addFavorite = async (req, res) => {
  const { movie_id } = req.body;
  const user_id = req.user.id;
  const user_email = req.user.email;

  if (!movie_id) {
    return res.status(400).json({ error: 'ID do filme é obrigatório para favoritar.' });
  }

  try {
    const favorite = await Favorite.add(movie_id, user_id, user_email, req.supabase);
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({ error: 'Não foi possível favoritar. Talvez o filme já esteja na sua lista.' });
  }
};

// Remover filme dos favoritos
export const removeFavorite = async (req, res) => {
  const { movieId } = req.params;
  const user_id = req.user.id;

  try {
    const data = await Favorite.remove(movieId, user_id, req.supabase);
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado para remoção.' });
    }
    res.json({ message: 'Filme removido dos seus favoritos com sucesso.', data });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ error: 'Erro ao tentar remover o filme dos favoritos.' });
  }
};
