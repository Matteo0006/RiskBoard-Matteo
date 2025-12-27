import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ObligationStatus, RiskLevel, ObligationCategory } from '@/types/compliance';

interface StatusBadgeProps {
  status: ObligationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<ObligationStatus, string> = {
    pending: 'bg-muted text-muted-foreground hover:bg-muted',
    in_progress: 'bg-primary/10 text-primary hover:bg-primary/20',
    completed: 'bg-success/10 text-success hover:bg-success/20',
    overdue: 'bg-danger/10 text-danger hover:bg-danger/20',
  };

  const labels: Record<ObligationStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', styles[status])}>
      {labels[status]}
    </Badge>
  );
}

interface RiskBadgeProps {
  risk: RiskLevel;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const styles: Record<RiskLevel, string> = {
    low: 'bg-success/10 text-success hover:bg-success/20',
    medium: 'bg-warning/10 text-warning hover:bg-warning/20',
    high: 'bg-danger/10 text-danger hover:bg-danger/20',
  };

  const labels: Record<RiskLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', styles[risk])}>
      {labels[risk]}
    </Badge>
  );
}

interface CategoryBadgeProps {
  category: ObligationCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const styles: Record<ObligationCategory, string> = {
    tax: 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20',
    license: 'bg-chart-5/10 text-chart-5 hover:bg-chart-5/20',
    regulatory: 'bg-chart-3/10 text-chart-3 hover:bg-chart-3/20',
  };

  const labels: Record<ObligationCategory, string> = {
    tax: 'Tax & Financial',
    license: 'Licenses & Permits',
    regulatory: 'Regulatory & Legal',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', styles[category])}>
      {labels[category]}
    </Badge>
  );
}
