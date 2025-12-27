import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge, RiskBadge, CategoryBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useObligations } from '@/hooks/useComplianceData';
import { calculateDashboardStats, calculateDaysUntilDeadline, calculateRiskLevel } from '@/lib/compliance';
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

export default function Dashboard() {
  const { obligations, isLoading } = useObligations();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const stats = calculateDashboardStats(obligations);

  // Prepare chart data
  const categoryData = [
    { name: 'Tax & Financial', value: obligations.filter(o => o.category === 'tax').length, color: 'hsl(220, 60%, 25%)' },
    { name: 'Licenses & Permits', value: obligations.filter(o => o.category === 'license').length, color: 'hsl(200, 70%, 45%)' },
    { name: 'Regulatory & Legal', value: obligations.filter(o => o.category === 'regulatory').length, color: 'hsl(38, 92%, 50%)' },
  ];

  const riskData = [
    { name: 'High Risk', value: obligations.filter(o => calculateRiskLevel(o) === 'high').length, color: 'hsl(0, 70%, 50%)' },
    { name: 'Medium Risk', value: obligations.filter(o => calculateRiskLevel(o) === 'medium').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Low Risk', value: obligations.filter(o => calculateRiskLevel(o) === 'low').length, color: 'hsl(142, 70%, 40%)' },
  ];

  const statusData = [
    { name: 'Pending', count: obligations.filter(o => o.status === 'pending').length },
    { name: 'In Progress', count: obligations.filter(o => o.status === 'in_progress').length },
    { name: 'Completed', count: obligations.filter(o => o.status === 'completed').length },
    { name: 'Overdue', count: obligations.filter(o => o.status === 'overdue').length },
  ];

  // Upcoming deadlines (next 30 days, not completed)
  const upcomingObligations = obligations
    .filter(o => o.status !== 'completed')
    .map(o => ({ ...o, daysUntil: calculateDaysUntilDeadline(o.deadline), risk: calculateRiskLevel(o) }))
    .filter(o => o.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your compliance obligations and deadlines</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Obligations"
            value={stats.totalObligations}
            description="Active compliance items"
            icon={ClipboardList}
            variant="default"
          />
          <StatCard
            title="Due in 7 Days"
            value={stats.upcomingIn7Days}
            description="Immediate attention required"
            icon={Clock}
            variant={stats.upcomingIn7Days > 3 ? 'warning' : 'default'}
          />
          <StatCard
            title="Overdue"
            value={stats.overdueCount}
            description="Requires urgent action"
            icon={AlertTriangle}
            variant={stats.overdueCount > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Compliance Score"
            value={`${stats.complianceScore}%`}
            description="Overall compliance health"
            icon={TrendingUp}
            variant={stats.complianceScore >= 80 ? 'success' : stats.complianceScore >= 60 ? 'warning' : 'danger'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>Current risk levels across obligations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {riskData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Category</CardTitle>
              <CardDescription>Obligations grouped by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Overview</CardTitle>
              <CardDescription>Obligations by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(220, 60%, 25%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                <CardDescription>Next 30 days - sorted by urgency</CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingObligations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No upcoming deadlines in the next 30 days</p>
            ) : (
              <div className="space-y-3">
                {upcomingObligations.map((obl) => (
                  <div
                    key={obl.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{obl.title}</p>
                        <CategoryBadge category={obl.category} />
                      </div>
                      <p className="text-sm text-muted-foreground">{obl.assignedTo}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {format(parseISO(obl.deadline), 'MMM d, yyyy')}
                        </p>
                        <p className={`text-xs ${obl.daysUntil < 0 ? 'text-danger' : obl.daysUntil <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {obl.daysUntil < 0
                            ? `${Math.abs(obl.daysUntil)} days overdue`
                            : obl.daysUntil === 0
                            ? 'Due today'
                            : `${obl.daysUntil} days left`}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <StatusBadge status={obl.status} />
                        <RiskBadge risk={obl.risk} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
