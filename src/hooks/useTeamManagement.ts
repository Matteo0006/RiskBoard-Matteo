import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCompanyContext } from '@/contexts/CompanyContext';
import type { Database } from '@/integrations/supabase/types';

type CompanyMemberRow = Database['public']['Tables']['company_members']['Row'];
type CompanyInvitationRow = Database['public']['Tables']['company_invitations']['Row'];
type CompanyRole = Database['public']['Enums']['company_role'];

export interface TeamMember extends CompanyMemberRow {
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentCompany, canManage } = useCompanyContext();

  const fetchTeam = useCallback(async () => {
    if (!user || !currentCompany) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      // Fetch profiles for members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const membersWithProfiles: TeamMember[] = membersData.map(member => ({
          ...member,
          profile: profiles?.find(p => p.user_id === member.user_id) || undefined
        }));

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile caricare il team' });
    }
    setLoading(false);
  }, [user, currentCompany, toast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const inviteMember = async (email: string, role: CompanyRole) => {
    if (!user || !currentCompany || !canManage) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Non hai i permessi per invitare membri' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: currentCompany.id,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ variant: 'destructive', title: 'Errore', description: 'Questo utente è già stato invitato' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: 'Invito inviato', description: `Invito inviato a ${email}` });
      await fetchTeam();
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile inviare l\'invito' });
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, newRole: CompanyRole) => {
    if (!canManage) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Non hai i permessi per modificare i ruoli' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: 'Ruolo aggiornato', description: 'Il ruolo è stato modificato' });
      await fetchTeam();
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile modificare il ruolo' });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!canManage) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Non hai i permessi per rimuovere membri' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: 'Membro rimosso', description: 'Il membro è stato rimosso dal team' });
      await fetchTeam();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile rimuovere il membro' });
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!canManage) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Non hai i permessi per annullare inviti' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({ title: 'Invito annullato', description: 'L\'invito è stato annullato' });
      await fetchTeam();
      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile annullare l\'invito' });
      return false;
    }
  };

  return {
    members,
    invitations,
    loading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    refetch: fetchTeam,
  };
}
