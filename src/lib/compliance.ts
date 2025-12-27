import { Obligation, DashboardStats, RiskLevel } from '@/types/compliance';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';

export function calculateDaysUntilDeadline(deadline: string): number {
  return differenceInDays(parseISO(deadline), new Date());
}

export function calculateRiskLevel(obligation: Obligation): RiskLevel {
  const daysUntil = calculateDaysUntilDeadline(obligation.deadline);
  
  if (obligation.status === 'completed') return 'low';
  if (obligation.status === 'overdue' || daysUntil < 0) return 'high';
  
  // High penalty severity obligations are higher risk
  if (obligation.penaltySeverity === 'high') {
    if (daysUntil <= 7) return 'high';
    if (daysUntil <= 30) return 'medium';
    return 'low';
  }
  
  // Medium penalty severity
  if (obligation.penaltySeverity === 'medium') {
    if (daysUntil <= 5) return 'high';
    if (daysUntil <= 14) return 'medium';
    return 'low';
  }
  
  // Low penalty severity
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
}

export function calculateDashboardStats(obligations: Obligation[]): DashboardStats {
  const today = new Date();
  
  const upcomingIn7Days = obligations.filter(obl => {
    if (obl.status === 'completed') return false;
    const days = calculateDaysUntilDeadline(obl.deadline);
    return days >= 0 && days <= 7;
  }).length;
  
  const upcomingIn30Days = obligations.filter(obl => {
    if (obl.status === 'completed') return false;
    const days = calculateDaysUntilDeadline(obl.deadline);
    return days >= 0 && days <= 30;
  }).length;
  
  const upcomingIn90Days = obligations.filter(obl => {
    if (obl.status === 'completed') return false;
    const days = calculateDaysUntilDeadline(obl.deadline);
    return days >= 0 && days <= 90;
  }).length;
  
  const overdueCount = obligations.filter(obl => 
    obl.status === 'overdue' || (obl.status !== 'completed' && calculateDaysUntilDeadline(obl.deadline) < 0)
  ).length;
  
  const completedCount = obligations.filter(obl => obl.status === 'completed').length;
  
  // Compliance score: percentage of on-time completions vs total obligations
  const totalActive = obligations.length;
  const compliantCount = completedCount + obligations.filter(obl => 
    obl.status !== 'completed' && obl.status !== 'overdue' && calculateDaysUntilDeadline(obl.deadline) >= 0
  ).length;
  const complianceScore = totalActive > 0 ? Math.round((compliantCount / totalActive) * 100) : 100;
  
  return {
    totalObligations: obligations.length,
    upcomingIn7Days,
    upcomingIn30Days,
    upcomingIn90Days,
    overdueCount,
    completedCount,
    complianceScore,
  };
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tax: 'Tax & Financial',
    license: 'Licenses & Permits',
    regulatory: 'Regulatory & Legal',
  };
  return labels[category] || category;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };
  return labels[status] || status;
}

export function getRecurrenceLabel(recurrence: string): string {
  const labels: Record<string, string> = {
    one_time: 'One-time',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };
  return labels[recurrence] || recurrence;
}

export function getRiskLabel(risk: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    high: 'High Risk',
    medium: 'Medium Risk',
    low: 'Low Risk',
  };
  return labels[risk];
}
