import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database, Json } from '@/integrations/supabase/types';

export type ObligationRow = Database['public']['Tables']['obligations']['Row'];
export type ObligationInsert = Database['public']['Tables']['obligations']['Insert'];
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ReminderConfigRow = Database['public']['Tables']['reminder_configs']['Row'];
export type ReminderConfigInsert = Database['public']['Tables']['reminder_configs']['Insert'];

// Helper to map DB category to display format
export const categoryMap: Record<string, string> = {
  'tax_financial': 'tax',
  'licenses_permits': 'license',
  'regulatory_legal': 'regulatory',
};

export const reverseCategoryMap: Record<string, Database['public']['Enums']['obligation_category']> = {
  'tax': 'tax_financial',
  'license': 'licenses_permits',
  'regulatory': 'regulatory_legal',
};

export function useObligationsDB() {
  const [obligations, setObligations] = useState<ObligationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchObligations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
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
    isLoading: loading,
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
    if (!user) {
      setLoading(false);
      return;
    }
    
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

  const deleteCompany = async () => {
    if (!user || !company) return false;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id)
      .eq('user_id', user.id); // Double check user ownership

    if (error) {
      console.error('Error deleting company:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile eliminare il profilo aziendale' });
      return false;
    }
    
    setCompany(null);
    toast({ title: 'Successo', description: 'Profilo aziendale eliminato' });
    return true;
  };

  return {
    company,
    loading,
    isLoading: loading,
    saveCompany,
    deleteCompany,
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

  return { profile, loading, isLoading: loading };
}

export function useReminderConfigsDB() {
  const [reminders, setReminders] = useState<ReminderConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('reminder_configs')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching reminders:', error);
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const updateReminder = async (obligationId: string, updates: Partial<ReminderConfigRow>) => {
    if (!user) return false;
    
    // Check if reminder config exists
    const existing = reminders.find(r => r.obligation_id === obligationId);
    
    if (existing) {
      const { error } = await supabase
        .from('reminder_configs')
        .update(updates)
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating reminder:', error);
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare il promemoria' });
        return false;
      }
    } else {
      // Create new reminder config
      const { error } = await supabase
        .from('reminder_configs')
        .insert({
          obligation_id: obligationId,
          user_id: user.id,
          days_before: updates.days_before || [30, 14, 7, 1],
          email_enabled: updates.email_enabled ?? true,
          push_enabled: updates.push_enabled ?? false,
        });

      if (error) {
        console.error('Error creating reminder:', error);
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile creare il promemoria' });
        return false;
      }
    }
    
    await fetchReminders();
    return true;
  };

  const createReminderForObligation = async (obligationId: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('reminder_configs')
      .insert({
        obligation_id: obligationId,
        user_id: user.id,
        days_before: [30, 14, 7, 1],
        email_enabled: true,
        push_enabled: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder config:', error);
      return null;
    }

    await fetchReminders();
    return data;
  };

  return {
    reminders,
    loading,
    isLoading: loading,
    updateReminder,
    createReminderForObligation,
    refetch: fetchReminders,
  };
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
      } else if (error.message?.includes('402')) {
        toast({ variant: 'destructive', title: 'Crediti esauriti', description: 'Ricarica il tuo account per continuare' });
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

// Activity log helper
export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: (details as unknown as Json) || null,
      }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
}
