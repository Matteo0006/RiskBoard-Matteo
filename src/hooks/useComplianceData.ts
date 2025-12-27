import { useState, useEffect } from 'react';
import { Obligation, CompanyProfile, ReminderConfig } from '@/types/compliance';
import { sampleObligations, sampleCompanyProfile, sampleReminderConfigs } from '@/data/sampleData';

const STORAGE_KEYS = {
  obligations: 'compliance_obligations',
  company: 'compliance_company',
  reminders: 'compliance_reminders',
};

export function useObligations() {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.obligations);
    if (stored) {
      setObligations(JSON.parse(stored));
    } else {
      setObligations(sampleObligations);
      localStorage.setItem(STORAGE_KEYS.obligations, JSON.stringify(sampleObligations));
    }
    setIsLoading(false);
  }, []);

  const saveObligations = (newObligations: Obligation[]) => {
    setObligations(newObligations);
    localStorage.setItem(STORAGE_KEYS.obligations, JSON.stringify(newObligations));
  };

  const addObligation = (obligation: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newObligation: Obligation = {
      ...obligation,
      id: `obl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveObligations([...obligations, newObligation]);
    return newObligation;
  };

  const updateObligation = (id: string, updates: Partial<Obligation>) => {
    const updated = obligations.map(obl =>
      obl.id === id ? { ...obl, ...updates, updatedAt: new Date().toISOString() } : obl
    );
    saveObligations(updated);
  };

  const deleteObligation = (id: string) => {
    saveObligations(obligations.filter(obl => obl.id !== id));
  };

  const resetToSample = () => {
    saveObligations(sampleObligations);
  };

  return {
    obligations,
    isLoading,
    addObligation,
    updateObligation,
    deleteObligation,
    resetToSample,
  };
}

export function useCompanyProfile() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.company);
    if (stored) {
      setCompany(JSON.parse(stored));
    } else {
      setCompany(sampleCompanyProfile);
      localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(sampleCompanyProfile));
    }
    setIsLoading(false);
  }, []);

  const updateCompany = (updates: Partial<CompanyProfile>) => {
    if (company) {
      const updated = { ...company, ...updates };
      setCompany(updated);
      localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(updated));
    }
  };

  const resetToSample = () => {
    setCompany(sampleCompanyProfile);
    localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(sampleCompanyProfile));
  };

  return { company, isLoading, updateCompany, resetToSample };
}

export function useReminderConfigs() {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.reminders);
    if (stored) {
      setReminders(JSON.parse(stored));
    } else {
      setReminders(sampleReminderConfigs);
      localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(sampleReminderConfigs));
    }
    setIsLoading(false);
  }, []);

  const updateReminder = (obligationId: string, updates: Partial<ReminderConfig>) => {
    const updated = reminders.map(rem =>
      rem.obligationId === obligationId ? { ...rem, ...updates } : rem
    );
    setReminders(updated);
    localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(updated));
  };

  return { reminders, isLoading, updateReminder };
}
