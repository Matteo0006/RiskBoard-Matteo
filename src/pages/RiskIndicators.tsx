import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useObligations } from '@/hooks/useComplianceData';
import { calculateRiskLevel, calculateDaysUntilDeadline, getCategoryLabel } from '@/lib/compliance';
import { RiskBadge, StatusBadge, CategoryBadge } from '@/components/StatusBadge';
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { RiskLevel, Obligation } from '@/types/compliance';

export default function RiskIndicators() {
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

  // Calculate risk metrics
  const obligationsWithRisk = obligations.map(obl => ({
    ...obl,
    risk: calculateRiskLevel(obl),
    daysUntil: calculateDaysUntilDeadline(obl.deadline),
  }));

  const highRisk = obligationsWithRisk.filter(o => o.risk === 'high');
  const mediumRisk = obligationsWithRisk.filter(o => o.risk === 'medium');
  const lowRisk = obligationsWithRisk.filter(o => o.risk === 'low');

  // Risk score (0-100, lower is better)
  const riskScore = Math.round(
    ((highRisk.length * 3 + mediumRisk.length * 2 + lowRisk.length * 1) / 
    (obligations.length * 3)) * 100
  );

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
    if (likelihood === 'High' && impact === 'High') return 'bg-danger/20 border-danger/40';
    if ((likelihood === 'High' && impact === 'Medium') || (likelihood === 'Medium' && impact === 'High')) return 'bg-danger/10 border-danger/30';
    if ((likelihood === 'High' && impact === 'Low') || (likelihood === 'Medium' && impact === 'Medium') || (likelihood === 'Low' && impact === 'High')) return 'bg-warning/20 border-warning/40';
    if ((likelihood === 'Medium' && impact === 'Low') || (likelihood === 'Low' && impact === 'Medium')) return 'bg-warning/10 border-warning/30';
    return 'bg-success/10 border-success/30';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Indicators</h1>
          <p className="text-muted-foreground">Analyze and monitor compliance risk levels</p>
        </div>

        {/* Risk Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Risk Score</p>
                  <p className="text-3xl font-bold text-foreground">{riskScore}%</p>
                </div>
                <div className={`rounded-lg p-3 ${riskScore <= 33 ? 'bg-success/10' : riskScore <= 66 ? 'bg-warning/10' : 'bg-danger/10'}`}>
                  {riskScore <= 33 ? (
                    <TrendingDown className="h-5 w-5 text-success" />
                  ) : riskScore <= 66 ? (
                    <Minus className="h-5 w-5 text-warning" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-danger" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-danger">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">High Risk</p>
              <p className="text-3xl font-bold text-danger">{highRisk.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Immediate attention required</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Medium Risk</p>
              <p className="text-3xl font-bold text-warning">{mediumRisk.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Low Risk</p>
              <p className="text-3xl font-bold text-success">{lowRisk.length}</p>
              <p className="text-xs text-muted-foreground mt-1">On track</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Matrix</CardTitle>
            <CardDescription>Likelihood vs. Impact analysis of current obligations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-4 gap-2">
                  {/* Header row */}
                  <div></div>
                  <div className="text-center text-sm font-medium text-muted-foreground py-2">Low Impact</div>
                  <div className="text-center text-sm font-medium text-muted-foreground py-2">Medium Impact</div>
                  <div className="text-center text-sm font-medium text-muted-foreground py-2">High Impact</div>

                  {/* High likelihood row */}
                  <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">High Likelihood</div>
                  {['Low', 'Medium', 'High'].map(impact => {
                    const cell = riskMatrix.find(m => m.likelihood === 'High' && m.impact === impact);
                    return (
                      <div key={`high-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('High', impact)}`}>
                        <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                        <p className="text-xs text-muted-foreground">items</p>
                      </div>
                    );
                  })}

                  {/* Medium likelihood row */}
                  <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">Medium Likelihood</div>
                  {['Low', 'Medium', 'High'].map(impact => {
                    const cell = riskMatrix.find(m => m.likelihood === 'Medium' && m.impact === impact);
                    return (
                      <div key={`medium-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('Medium', impact)}`}>
                        <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                        <p className="text-xs text-muted-foreground">items</p>
                      </div>
                    );
                  })}

                  {/* Low likelihood row */}
                  <div className="text-right text-sm font-medium text-muted-foreground pr-3 flex items-center justify-end">Low Likelihood</div>
                  {['Low', 'Medium', 'High'].map(impact => {
                    const cell = riskMatrix.find(m => m.likelihood === 'Low' && m.impact === impact);
                    return (
                      <div key={`low-${impact}`} className={`rounded-lg border-2 p-4 text-center ${getMatrixCellColor('Low', impact)}`}>
                        <p className="text-2xl font-bold text-foreground">{cell?.count || 0}</p>
                        <p className="text-xs text-muted-foreground">items</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted p-4">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong>How risk is calculated:</strong> Likelihood is based on days until deadline (≤7 days = High, ≤30 days = Medium, &gt;30 days = Low). 
                Impact is based on the penalty severity assigned to each obligation.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Risk Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <CardTitle>High Risk Items</CardTitle>
            </div>
            <CardDescription>These obligations require immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {highRisk.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No high-risk items at this time</p>
            ) : (
              <div className="space-y-3">
                {highRisk.map((obl) => (
                  <div
                    key={obl.id}
                    className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 p-4"
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
                        <p className={`text-xs ${obl.daysUntil < 0 ? 'text-danger' : 'text-warning'}`}>
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
