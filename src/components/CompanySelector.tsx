import { Building2, ChevronDown, Check, Users, Crown, Eye, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompanyContext, CompanyWithRole } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-muted text-muted-foreground border-muted' },
};

export function CompanySelector() {
  const { companies, currentCompany, setCurrentCompany, loading } = useCompanyContext();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 animate-pulse">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  const RoleIcon = currentCompany ? roleConfig[currentCompany.role].icon : Building2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto font-normal hover:bg-accent"
        >
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate font-medium">
            {currentCompany?.name || 'Seleziona azienda'}
          </span>
          {currentCompany && (
            <Badge variant="outline" className={cn('text-xs px-1.5 py-0', roleConfig[currentCompany.role].color)}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {roleConfig[currentCompany.role].label}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Le tue aziende
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => {
          const RoleItemIcon = roleConfig[company.role].icon;
          return (
            <DropdownMenuItem
              key={company.id}
              onClick={() => setCurrentCompany(company)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{company.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className={cn('text-xs px-1.5 py-0', roleConfig[company.role].color)}>
                  <RoleItemIcon className="h-3 w-3" />
                </Badge>
                {currentCompany?.id === company.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
