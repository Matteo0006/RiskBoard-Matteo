import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useObligationsDB, categoryMap, type ObligationRow } from '@/hooks/useSupabaseData';
import { calculateRiskLevel, calculateDaysUntilDeadline } from '@/lib/compliance';
import { RiskBadge, StatusBadge, CategoryBadge } from '@/components/StatusBadge';
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Info, Download, FileText } from 'lucide-react';
import { downloadRiskReport } from '@/lib/pdfExport';
import { useCompanyDB } from '@/hooks/useSupabaseData';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RiskLevel } from '@/types/compliance';

// Helper to convert DB obligation to UI format for risk calculation
const toUIFormat = (obl: ObligationRow) => ({
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

export default function RiskIndicators() {
  const { obligations, isLoading } = useObligationsDB();
  const { company } = useCompanyDB();
  const { toast } = useToast();

  const exportToPDF = () => {
    downloadRiskReport(obligations, company);
    toast({ title: 'Export completato', description: 'Report Rischio PDF scaricato' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Calculate risk metrics
  const obligationsWithRisk = obligations.map(obl => {
    const uiObl = toUIFormat(obl);
    return {
      ...obl,
      uiCategory: uiObl.category,
      risk: calculateRiskLevel(uiObl as any),
      daysUntil: calculateDaysUntilDeadline(obl.deadline),
      penaltySeverity: uiObl.penaltySeverity,
    };
  });

  const highRisk = obligationsWithRisk.filter(o => o.risk === 'high');
  const mediumRisk = obligationsWithRisk.filter(o => o.risk === 'medium');
  const lowRisk = obligationsWithRisk.filter(o => o.risk === 'low');

  // Risk score (0-100, lower is better)
  const totalWeight = obligations.length * 3;
  const riskScore = totalWeight > 0 
    ? Math.round(((highRisk.length * 3 + mediumRisk.length * 2 + lowRisk.length * 1) / totalWeight) * 100)
    : 0;

  // Risk matrix data
  const riskMatrix: { likelihood: string; impact: string; count: number; items: typeof obligationsWithRisk }[] = [
    { likelihood: 'High', impact: 'High', count: 0, items: [] },
    { likelihood: 'High', impact: 'Medium', count: 0, items: [] },
    { likelihood: 'High', impact: 'Low', count: 0, items: [] },
    { likelihood: 'Medium', impact: 'High', count: 0, items: [] },
    { likelihood: 'Medium', impact: 'Medium', count: 0, items: [] },
    { likelihood: 'Medium', impact: 'Low', count: 0, items: [] },
    { likelihood: 'Low', impact: 'High', count: 0, items: [] },
    { likelihood: 'Low', impact: 'Medium', count: 0, items: [] },
    { likelihood: 'Low', impact: 'Low', count: 0, items: [] },
  ];

  // Populate risk matrix
  obligationsWithRisk.forEach(obl => {
    if (obl.status === 'completed') return;
    
    let likelihood: 'High' | 'Medium' | 'Low';
    if (obl.daysUntil < 0 || obl.daysUntil <= 7) likelihood = 'High';
    else if (obl.daysUntil <= 30) likelihood = 'Medium';
    else likelihood = 'Low';

    const impact = obl.penaltySeverity.charAt(0).toUpperCase() + obl.penaltySeverity.slice(1) as 'High' | 'Medium' | 'Low';
    
    const cell = riskMatrix.find(m => m.likelihood === likelihood && m.impact === impact);
    if (cell) {
      cell.count++;
      cell.items.push(obl);
    }
  });

  const getMatrixCellColor = (likelihood: string, impact: string) => {
    if (likelihood === 'High' && impact === 'High') return 'bg-destructive/20 border-destructive/40';
    if ((likelihood === 'High' && impact === 'Medium') || (likelihood === 'Medium' && impact === 'High')) return 'bg-destructive/10 border-destructive/30';
    if ((likelihood === 'High' && impact === 'Low') || (likelihood === 'Medium' && impact === 'Medium') || (likelihood === 'Low' && impact === 'High')) return 'bg-warning/20 border-warning/40';
    if ((likelihood === 'Medium' && impact === 'Low') || (likelihood === 'Low' && impact === 'Medium')) return 'bg-warning/10 border-warning/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  // Export risk report
  const exportRiskReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalObligations: obligations.length,
        riskScore,
        highRiskCount: highRisk.length,
        mediumRiskCount: mediumRisk.length,
        lowRiskCount: lowRisk.length,
      },
      highRiskItems: highRisk.map(obl => ({
        title: obl.title,
        deadline: obl.deadline,
        daysUntil: obl.daysUntil,
        status: obl.status,
        penaltySeverity: obl.penaltySeverity,
      })),
      riskMatrix: riskMatrix.filter(cell => cell.count > 0).map(cell => ({
        likelihood: cell.likelihood,
        impact: cell.impact,
        count: cell.count,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risk_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    
    toast({ title: 'Report esportato', description: 'Report dei rischi scaricato con successo' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Indicatori di Rischio</h1>
            <p className="text-muted-foreground">Analizza e monitora i livelli di rischio di compliance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportRiskReport}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {obligations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nessun dato disponibile</p>
              <p className="text-sm text-muted-foreground">Aggiungi degli obblighi per visualizzare gli indicatori di rischio</p>
            </CardContent>
          </Card>
        )}

        {obligations.length > 0 && (
          <>
            {/* Risk Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Punteggio Rischio</p>
                      <p className="text-3xl font-bold text-foreground">{riskScore}%</p>
                    </div>
                    <div className={`rounded-lg p-3 ${riskScore <= 33 ? 'bg-green-500/10' : riskScore <= 66 ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                      {riskScore <= 33 ? (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      ) : riskScore <= 66 ? (
                        <Minus className="h-5 w-5 text-warning" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-destructive">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Rischio Alto</p>
                  <p className="text-3xl font-bold text-destructive">{highRisk.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Attenzione immediata richiesta</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-warning">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Rischio Medio</p>
                  <p className="text-3xl font-bold text-warning">{mediumRisk.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Monitorare attentamente</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Rischio Basso</p>
                  <p className="text-3xl font-bold text-green-500">{lowRisk.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">In regola</p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Matrice di Rischio</CardTitle>
                <CardDescription>Analisi Probabilità vs. Impatto degli obblighi correnti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-4 gap-2">
                      {/* Header row */}
                      <div></div>
                      <div className="text-center text-sm font-medium text-muted-foreground py-2">Impatto Basso</div>
                      <div className="text-center text-sm font-medium text-muted-foreground py-2">Impatto Medio</div>
                      <div className="text-center text-sm font-medium text-muted-foreground py-2">Impatto Alto</div>

                      {/* High likelihood row */}
                      <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">Probabilità Alta</div>
                      {['Low', 'Medium', 'High'].map(impact => {
                        const cell = riskMatrix.find(m => m.likelihood === 'High' && m.impact === impact);
                        return (
                          <div key={`high-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('High', impact)}`}>
                            <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                            <p className="text-xs text-muted-foreground">elementi</p>
                          </div>
                        );
                      })}

                      {/* Medium likelihood row */}
                      <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">Probabilità Media</div>
                      {['Low', 'Medium', 'High'].map(impact => {
                        const cell = riskMatrix.find(m => m.likelihood === 'Medium' && m.impact === impact);
                        return (
                          <div key={`medium-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('Medium', impact)}`}>
                            <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                            <p className="text-xs text-muted-foreground">elementi</p>
                          </div>
                        );
                      })}

                      {/* Low likelihood row */}
                      <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">Probabilità Bassa</div>
                      {['Low', 'Medium', 'High'].map(impact => {
                        const cell = riskMatrix.find(m => m.likelihood === 'Low' && m.impact === impact);
                        return (
                          <div key={`low-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('Low', impact)}`}>
                            <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                            <p className="text-xs text-muted-foreground">elementi</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted p-4">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <strong>Come viene calcolato il rischio:</strong> La probabilità si basa sui giorni alla scadenza (≤7 giorni = Alta, ≤30 giorni = Media, &gt;30 giorni = Bassa). 
                    L'impatto si basa sulla gravità della penale assegnata a ciascun obbligo.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* High Risk Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle>Elementi ad Alto Rischio</CardTitle>
                </div>
                <CardDescription>Questi obblighi richiedono attenzione immediata</CardDescription>
              </CardHeader>
              <CardContent>
                {highRisk.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nessun elemento ad alto rischio al momento</p>
                ) : (
                  <div className="space-y-3">
                    {highRisk.map((obl) => (
                      <div
                        key={obl.id}
                        className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{obl.title}</p>
                            <CategoryBadge category={obl.uiCategory as any} />
                          </div>
                          <p className="text-sm text-muted-foreground">{obl.assigned_to || 'Non assegnato'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {format(parseISO(obl.deadline), 'dd MMM yyyy')}
                            </p>
                            <p className={`text-xs ${obl.daysUntil < 0 ? 'text-destructive' : 'text-warning'}`}>
                              {obl.daysUntil < 0
                                ? `${Math.abs(obl.daysUntil)} giorni scaduto`
                                : obl.daysUntil === 0
                                ? 'Scade oggi'
                                : `${obl.daysUntil} giorni rimanenti`}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <StatusBadge status={obl.status as any} />
                            <RiskBadge risk={obl.risk} />
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
