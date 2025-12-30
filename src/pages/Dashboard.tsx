import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge, RiskBadge, CategoryBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useObligationsDB, categoryMap } from '@/hooks/useSupabaseData';
import { calculateDaysUntilDeadline, calculateRiskLevel } from '@/lib/compliance';
import { 
  ClipboardList, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { RiskLevel } from '@/types/compliance';

// Helper to convert DB obligation to UI format for calculation
const toUIFormat = (obl: any) => ({
  id: obl.id,
  title: obl.title,
  description: obl.description || '',
  category: categoryMap[obl.category] || obl.category,
  deadline: obl.deadline,
  recurrence: obl.frequency,
  status: obl.status,
  assignedTo: obl.assigned_to || '',
  penaltySeverity: (obl.risk_level || 'medium') as RiskLevel,
  notes: obl.notes || '',
  createdAt: obl.created_at,
  updatedAt: obl.updated_at,
});

export default function Dashboard() {
  const { obligations, isLoading } = useObligationsDB();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Convert to UI format for calculations
  const uiObligations = obligations.map(toUIFormat);

  // Calculate stats
  const total = uiObligations.length;
  const completed = uiObligations.filter(o => o.status === 'completed').length;
  const pending = uiObligations.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const overdue = uiObligations.filter(o => o.status === 'overdue').length;
  const highRisk = uiObligations.filter(o => calculateRiskLevel(o as any) === 'high').length;
  const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Prepare chart data
  const categoryData = [
    { name: 'Fiscale', value: uiObligations.filter(o => o.category === 'tax').length, color: 'hsl(220, 60%, 25%)' },
    { name: 'Licenze', value: uiObligations.filter(o => o.category === 'license').length, color: 'hsl(200, 70%, 45%)' },
    { name: 'Normativo', value: uiObligations.filter(o => o.category === 'regulatory').length, color: 'hsl(38, 92%, 50%)' },
  ];

  const riskData = [
    { name: 'Alto', value: uiObligations.filter(o => calculateRiskLevel(o as any) === 'high').length, color: 'hsl(0, 70%, 50%)' },
    { name: 'Medio', value: uiObligations.filter(o => calculateRiskLevel(o as any) === 'medium').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Basso', value: uiObligations.filter(o => calculateRiskLevel(o as any) === 'low').length, color: 'hsl(142, 70%, 40%)' },
  ];

  const statusData = [
    { name: 'In Attesa', count: uiObligations.filter(o => o.status === 'pending').length },
    { name: 'In Corso', count: uiObligations.filter(o => o.status === 'in_progress').length },
    { name: 'Completati', count: uiObligations.filter(o => o.status === 'completed').length },
    { name: 'Scaduti', count: uiObligations.filter(o => o.status === 'overdue').length },
  ];

  // Upcoming deadlines (next 30 days, not completed)
  const upcomingObligations = uiObligations
    .filter(o => o.status !== 'completed')
    .map(o => ({ ...o, daysUntil: calculateDaysUntilDeadline(o.deadline), risk: calculateRiskLevel(o as any) }))
    .filter(o => o.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Panoramica del tuo stato di compliance
          </p>
        </div>

        {/* Empty state */}
        {total === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nessun obbligo presente</p>
              <p className="text-muted-foreground">Vai alla sezione Obblighi per aggiungere il primo</p>
            </CardContent>
          </Card>
        )}

        {total > 0 && (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Totale Obblighi"
                value={total}
                description={`${pending} in attesa`}
                icon={ClipboardList}
              />
              <StatCard
                title="Tasso Compliance"
                value={`${complianceRate}%`}
                description={`${completed} completati`}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="In Scadenza (7gg)"
                value={upcomingObligations.filter(o => o.daysUntil <= 7).length}
                description="prossimi 7 giorni"
                icon={Clock}
                variant="warning"
              />
              <StatCard
                title="Alto Rischio"
                value={highRisk}
                description={`${overdue} scaduti`}
                icon={AlertTriangle}
                variant={highRisk > 0 ? 'danger' : 'default'}
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Per Categoria</CardTitle>
                  <CardDescription>Distribuzione obblighi per tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Per Stato</CardTitle>
                  <CardDescription>Distribuzione per stato attuale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Prossime Scadenze
                </CardTitle>
                <CardDescription>Obblighi in scadenza nei prossimi 30 giorni</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingObligations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>Nessuna scadenza imminente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingObligations.map((obl) => (
                      <div
                        key={obl.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{obl.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <CategoryBadge category={obl.category} />
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(obl.deadline), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBadge risk={obl.risk} />
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            obl.daysUntil <= 0 ? 'bg-destructive/10 text-destructive' :
                            obl.daysUntil <= 7 ? 'bg-warning/10 text-warning' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {obl.daysUntil <= 0 ? 'Scaduto' : `${obl.daysUntil}g`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
