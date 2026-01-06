import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, description, icon: Icon, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  const iconBgStyles = {
    default: 'from-primary/20 to-primary/5',
    success: 'from-success/20 to-success/5',
    warning: 'from-warning/20 to-warning/5',
    danger: 'from-danger/20 to-danger/5',
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-6 relative">
        {/* Subtle gradient background */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-bl-full opacity-50 -translate-y-8 translate-x-8 transition-transform duration-300 group-hover:scale-110",
          iconBgStyles[variant]
        )} />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn(
            'rounded-xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
            variantStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
