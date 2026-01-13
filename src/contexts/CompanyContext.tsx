import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type CompanyMemberRow = Database['public']['Tables']['company_members']['Row'];
type CompanyRole = Database['public']['Enums']['company_role'];

export interface CompanyWithRole extends CompanyRow {
  role: CompanyRole;
}

interface CompanyContextType {
  companies: CompanyWithRole[];
  currentCompany: CompanyWithRole | null;
  currentRole: CompanyRole | null;
  loading: boolean;
  setCurrentCompany: (company: CompanyWithRole | null) => void;
  refetch: () => Promise<void>;
  canManage: boolean; // owner or admin
  isOwner: boolean;
  isViewer: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyWithRole[]>([]);
  const [currentCompany, setCurrentCompanyState] = useState<CompanyWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setCurrentCompanyState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all companies where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        // Check if user owns any company directly (for backwards compatibility)
        const { data: ownedCompanies, error: ownedError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id);

        if (ownedError) throw ownedError;

        const companiesWithRole = (ownedCompanies || []).map(c => ({
          ...c,
          role: 'owner' as CompanyRole
        }));

        setCompanies(companiesWithRole);
        if (companiesWithRole.length > 0 && !currentCompany) {
          setCurrentCompanyState(companiesWithRole[0]);
        }
        setLoading(false);
        return;
      }

      // Fetch company details for all memberships
      const companyIds = memberships.map(m => m.company_id);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      const companiesWithRole: CompanyWithRole[] = (companiesData || []).map(company => {
        const membership = memberships.find(m => m.company_id === company.id);
        return {
          ...company,
          role: membership?.role || 'viewer'
        };
      });

      setCompanies(companiesWithRole);

      // Set current company if not set
      if (companiesWithRole.length > 0 && !currentCompany) {
        // Try to restore from localStorage
        const savedCompanyId = localStorage.getItem('currentCompanyId');
        const savedCompany = companiesWithRole.find(c => c.id === savedCompanyId);
        setCurrentCompanyState(savedCompany || companiesWithRole[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
    setLoading(false);
  }, [user, currentCompany]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const setCurrentCompany = (company: CompanyWithRole | null) => {
    setCurrentCompanyState(company);
    if (company) {
      localStorage.setItem('currentCompanyId', company.id);
    } else {
      localStorage.removeItem('currentCompanyId');
    }
  };

  const currentRole = currentCompany?.role || null;
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const isOwner = currentRole === 'owner';
  const isViewer = currentRole === 'viewer';

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        currentRole,
        loading,
        setCurrentCompany,
        refetch: fetchCompanies,
        canManage,
        isOwner,
        isViewer,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}
