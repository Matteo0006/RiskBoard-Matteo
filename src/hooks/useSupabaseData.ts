import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database } from '@/integrations/supabase/types';

type ObligationRow = Database['public']['Tables']['obligations']['Row'];
type ObligationInsert = Database['public']['Tables']['obligations']['Insert'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function useObligationsDB() {
  const [obligations, setObligations] = useState<ObligationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchObligations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('obligations')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error fetching obligations:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile caricare gli obblighi' });
    } else {
      setObligations(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchObligations();
  }, [fetchObligations]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('obligations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'obligations', filter: `user_id=eq.${user.id}` },
        () => {
          fetchObligations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchObligations]);

  const addObligation = async (obligation: Omit<ObligationInsert, 'user_id'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('obligations')
      .insert({ ...obligation, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding obligation:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiungere l\'obbligo' });
      return null;
    }
    
    toast({ title: 'Successo', description: 'Obbligo aggiunto con successo' });
    return data;
  };

  const updateObligation = async (id: string, updates: Partial<ObligationRow>) => {
    const { error } = await supabase
      .from('obligations')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating obligation:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare l\'obbligo' });
      return false;
    }
    
    toast({ title: 'Successo', description: 'Obbligo aggiornato' });
    return true;
  };

  const deleteObligation = async (id: string) => {
    const { error } = await supabase
      .from('obligations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting obligation:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile eliminare l\'obbligo' });
      return false;
    }
    
    toast({ title: 'Successo', description: 'Obbligo eliminato' });
    return true;
  };

  return {
    obligations,
    loading,
    addObligation,
    updateObligation,
    deleteObligation,
    refetch: fetchObligations,
  };
}

export function useCompanyDB() {
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCompany = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company:', error);
    } else {
      setCompany(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const saveCompany = async (companyData: Omit<CompanyInsert, 'user_id'>) => {
    if (!user) return null;

    if (company) {
      // Update existing
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', company.id)
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile salvare i dati aziendali' });
        return null;
      }
      
      setCompany(data);
      toast({ title: 'Successo', description: 'Profilo aziendale aggiornato' });
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('companies')
        .insert({ ...companyData, user_id: user.id })
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile creare il profilo aziendale' });
        return null;
      }
      
      setCompany(data);
      toast({ title: 'Successo', description: 'Profilo aziendale creato' });
      return data;
    }
  };

  return {
    company,
    loading,
    saveCompany,
    refetch: fetchCompany,
  };
}

export function useProfileDB() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}

export function useAIInsights() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getInsight = async (
    type: 'risk_analysis' | 'compliance_score' | 'recommendations' | 'deadline_summary',
    obligations: ObligationRow[],
    company?: CompanyRow | null
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { type, obligations, company },
      });

      if (error) {
        throw error;
      }

      return data.insight as string;
    } catch (error: any) {
      console.error('AI insight error:', error);
      
      if (error.message?.includes('429')) {
        toast({ variant: 'destructive', title: 'Limite raggiunto', description: 'Troppe richieste, riprova tra poco' });
      } else {
        toast({ variant: 'destructive', title: 'Errore AI', description: 'Impossibile generare l\'analisi' });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getInsight, loading };
}
