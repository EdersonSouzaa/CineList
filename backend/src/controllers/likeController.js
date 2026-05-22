import { supabase as anonClient } from '../config/supabase.js';

export const toggleLikeReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const userId = req.user.id;
  const client = req.supabase || anonClient;

  try {
    // Verifica se a curtida já existe para este comentário e usuário
    const { data: existingLike, error: fetchError } = await client
      .from('review_likes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let liked = false;

    if (existingLike) {
      // Se já existe, remove a curtida
      const { error: deleteError } = await client
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      liked = false;
    } else {
      // Se não existe, cria a nova curtida
      const { error: insertError } = await client
        .from('review_likes')
        .insert({ review_id: reviewId, user_id: userId });

      if (insertError) throw insertError;
      liked = true;
    }

    // Busca todas as curtidas atuais para retornar o número total atualizado e quem curtiu
    const { data: allLikes, error: countError } = await client
      .from('review_likes')
      .select('user_id')
      .eq('review_id', reviewId);

    if (countError) throw countError;

    return res.json({
      liked,
      like_count: allLikes.length,
      liked_by_users: allLikes.map(l => l.user_id)
    });
  } catch (error) {
    console.error('Erro ao alternar curtida em avaliação:', error);
    return res.status(500).json({ error: 'Falha ao processar curtida no comentário.' });
  }
};
