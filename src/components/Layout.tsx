import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardList, 
  AlertTriangle, 
  Bell, 
  Puzzle,
  Info
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Company Profile', href: '/company', icon: Building2 },
  { name: 'Obligations', href: '/obligations', icon: ClipboardList },
  { name: 'Risk Indicators', href: '/risk', icon: AlertTriangle },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'Integration Demo', href: '/integration', icon: Puzzle },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ComplianceTrack</h1>
              <p className="text-xs text-muted-foreground">Deadline Management System</p>
            </div>
          </div>
          
          {/* Prototype Notice */}
          <div className="ml-auto flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Prototype Demonstration</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card">
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Disclaimer */}
          <div className="absolute bottom-0 left-0 right-0 border-t bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Disclaimer:</strong> This is a prototype demonstration. 
              No legal advice provided. No guarantees of compliance.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
