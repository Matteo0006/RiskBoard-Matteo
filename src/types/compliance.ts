export type ObligationCategory = 'tax' | 'license' | 'regulatory';
export type ObligationStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type RecurrenceType = 'one_time' | 'monthly' | 'quarterly' | 'annual';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Obligation {
  id: string;
  title: string;
  description: string;
  category: ObligationCategory;
  deadline: string; // ISO date string
  recurrence: RecurrenceType;
  status: ObligationStatus;
  assignedTo: string;
  penaltySeverity: RiskLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  registrationNumber: string;
  industrySector: string;
  address: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  responsiblePerson: string;
  responsiblePersonTitle: string;
}

export interface ReminderConfig {
  obligationId: string;
  reminderDays: number[]; // Days before deadline
  enabled: boolean;
}

export interface DashboardStats {
  totalObligations: number;
  upcomingIn7Days: number;
  upcomingIn30Days: number;
  upcomingIn90Days: number;
  overdueCount: number;
  completedCount: number;
  complianceScore: number;
}
