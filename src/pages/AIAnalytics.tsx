import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Brain, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";

interface AIRequestLog {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  response_time_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
  created_at: string;
}

interface DailyStats {
  date: string;
  count: number;
  avgResponseTime: number;
}

interface TypeStats {
  name: string;
  value: number;
}

interface StatusStats {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(var(--accent))'];
const STATUS_COLORS: Record<string, string> = {
  success: 'hsl(142, 76%, 36%)',
  error: 'hsl(0, 84%, 60%)',
  rate_limited: 'hsl(45, 93%, 47%)'
};

export default function AIAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AIRequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStats[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data, error } = await supabase
        .from('ai_request_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as AIRequestLog[];
      setLogs(typedData);
      processStats(typedData);
    } catch (error) {
      console.error("Error fetching AI logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data: AIRequestLog[]) => {
    // Daily stats for the last 14 days
    const dailyMap = new Map<string, { count: number; totalTime: number }>();
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      return format(date, 'yyyy-MM-dd');
    });

    last14Days.forEach(date => {
      dailyMap.set(date, { count: 0, totalTime: 0 });
    });

    data.forEach(log => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (dailyMap.has(date)) {
        const current = dailyMap.get(date)!;
        current.count++;
        if (log.response_time_ms) {
          current.totalTime += log.response_time_ms;
        }
      }
    });

    const daily = last14Days.map(date => {
      const stats = dailyMap.get(date)!;
      return {
        date: format(new Date(date), 'dd MMM', { locale: it }),
        count: stats.count,
        avgResponseTime: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0
      };
    });
    setDailyStats(daily);

    // Type stats
    const typeMap = new Map<string, number>();
    data.forEach(log => {
      const type = log.request_type || 'unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    const types = Array.from(typeMap.entries())
      .map(([name, value]) => ({ name: formatTypeName(name), value }))
      .sort((a, b) => b.value - a.value);
    setTypeStats(types);

    // Status stats
    const statusMap = new Map<string, number>();
    data.forEach(log => {
      const status = log.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const statuses = Array.from(statusMap.entries()).map(([name, value]) => ({
      name: formatStatusName(name),
      value,
      color: STATUS_COLORS[name] || 'hsl(var(--muted))'
    }));
    setStatusStats(statuses);
  };

  const formatTypeName = (type: string): string => {
    const names: Record<string, string> = {
      risk_analysis: 'Analisi Rischi',
      compliance_score: 'Punteggio Compliance',
      recommendations: 'Raccomandazioni',
      deadline_summary: 'Riepilogo Scadenze',
      unknown: 'Altro'
    };
    return names[type] || type;
  };

  const formatStatusName = (status: string): string => {
    const names: Record<string, string> = {
      success: 'Successo',
      error: 'Errore',
      rate_limited: 'Rate Limited'
    };
    return names[status] || status;
  };

  const totalRequests = logs.length;
  const successfulRequests = logs.filter(l => l.status === 'success').length;
  const avgResponseTime = logs.length > 0 
    ? Math.round(logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length)
    : 0;
  const errorRate = totalRequests > 0 
    ? Math.round((logs.filter(l => l.status === 'error').length / totalRequests) * 100)
    : 0;

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics AI</h1>
          <p className="text-muted-foreground">Statistiche e utilizzo delle funzionalità AI negli ultimi 30 giorni</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Richieste Totali</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">ultimi 30 giorni</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Richieste Riuscite</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successfulRequests}</div>
              <p className="text-xs text-muted-foreground">
                {totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0}% del totale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Medio</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">tempo di risposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasso Errori</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorRate}%</div>
              <p className="text-xs text-muted-foreground">richieste fallite</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Requests Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Richieste Giornaliere
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Richieste" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tempo di Risposta Medio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" unit="ms" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}ms`, 'Tempo medio']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgResponseTime" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Tempo medio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Types Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {typeStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stato Richieste</CardTitle>
            </CardHeader>
            <CardContent>
              {statusStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ultime Richieste</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Data</th>
                      <th className="text-left py-3 px-2 font-medium">Tipo</th>
                      <th className="text-left py-3 px-2 font-medium">Stato</th>
                      <th className="text-left py-3 px-2 font-medium">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-3 px-2 text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                        </td>
                        <td className="py-3 px-2">{formatTypeName(log.request_type)}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'success' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : log.status === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {log.status === 'success' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {formatStatusName(log.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna richiesta AI registrata. Utilizza le funzionalità AI per vedere le statistiche qui.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}