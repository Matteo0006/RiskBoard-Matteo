import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { useAIInsights, useObligationsDB, useCompanyDB } from '@/hooks/useSupabaseData';

export default function AIInsightsPanel() {
  const { obligations } = useObligationsDB();
  const { company } = useCompanyDB();
  const { getInsight, loading } = useAIInsights();
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('risk');

  const generateInsight = async (type: 'risk_analysis' | 'compliance_score' | 'recommendations' | 'deadline_summary') => {
    const result = await getInsight(type, obligations, company);
    if (result) {
      setInsights(prev => ({ ...prev, [type]: result }));
    }
  };

  const tabs = [
    { id: 'risk_analysis', label: 'Analisi Rischi', icon: AlertTriangle },
    { id: 'compliance_score', label: 'Punteggio', icon: TrendingUp },
    { id: 'recommendations', label: 'Raccomandazioni', icon: Sparkles },
    { id: 'deadline_summary', label: 'Scadenze', icon: Calendar },
  ] as const;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Compliance Insights
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded">
            Powered by AI
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                <tab.icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="space-y-4">
                {insights[tab.id] ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                      {insights[tab.id]}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <tab.icon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Clicca per generare l'analisi AI</p>
                  </div>
                )}
                
                <Button
                  onClick={() => generateInsight(tab.id)}
                  disabled={loading || obligations.length === 0}
                  className="w-full"
                  variant={insights[tab.id] ? "outline" : "default"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {insights[tab.id] ? 'Rigenera Analisi' : 'Genera Analisi'}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {obligations.length === 0 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Aggiungi obblighi per abilitare l'analisi AI
          </p>
        )}
      </CardContent>
    </Card>
  );
}
