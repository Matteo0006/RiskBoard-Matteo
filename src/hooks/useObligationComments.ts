import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database } from '@/integrations/supabase/types';

type ObligationCommentRow = Database['public']['Tables']['obligation_comments']['Row'];

export interface CommentWithProfile extends ObligationCommentRow {
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useObligationComments(obligationId: string | null) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!obligationId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('obligation_comments')
        .select('*')
        .eq('obligation_id', obligationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        const commentsWithProfiles: CommentWithProfile[] = commentsData.map(comment => ({
          ...comment,
          profile: profiles?.find(p => p.user_id === comment.user_id) || undefined
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoading(false);
  }, [obligationId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    if (!obligationId) return;

    const channel = supabase
      .channel(`comments-${obligationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'obligation_comments',
          filter: `obligation_id=eq.${obligationId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obligationId, fetchComments]);

  const addComment = async (content: string) => {
    if (!user || !obligationId || !content.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('obligation_comments')
        .insert({
          obligation_id: obligationId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Commento aggiunto' });
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiungere il commento' });
      return null;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('obligation_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Commento aggiornato' });
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare il commento' });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('obligation_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Commento eliminato' });
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile eliminare il commento' });
      return false;
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments,
  };
}
