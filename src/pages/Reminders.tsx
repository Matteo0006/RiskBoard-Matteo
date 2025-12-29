import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useObligationsDB, useReminderConfigsDB, categoryMap } from '@/hooks/useSupabaseData';
import { calculateDaysUntilDeadline } from '@/lib/compliance';
import { CategoryBadge } from '@/components/StatusBadge';
import { Bell, BellOff, Clock, Info, Mail, Smartphone, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Reminders() {
  const { obligations, isLoading: oblLoading } = useObligationsDB();
  const { reminders, isLoading: remLoading, updateReminder, createReminderForObligation } = useReminderConfigsDB();

  const isLoading = oblLoading || remLoading;

  // Combine obligations with their reminder configs
  const obligationsWithReminders = useMemo(() => {
    return obligations
      .filter(obl => obl.status !== 'completed')
      .map(obl => {
        const reminder = reminders.find(r => r.obligation_id === obl.id);
        return {
          ...obl,
          uiCategory: categoryMap[obl.category] || obl.category,
          daysUntil: calculateDaysUntilDeadline(obl.deadline),
          reminderConfig: reminder || null,
          isEnabled: reminder?.email_enabled ?? true,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [obligations, reminders]);

  // Upcoming reminders
  const upcomingReminders = useMemo(() => {
    return obligationsWithReminders
      .filter(obl => obl.isEnabled && obl.daysUntil >= 0)
      .flatMap(obl => {
        const days = obl.reminderConfig?.days_before || [30, 14, 7, 1];
        return days
          .filter(d => obl.daysUntil <= d)
          .map(triggerDays => ({
            obligation: obl,
            triggerDays,
            isTriggered: obl.daysUntil <= triggerDays,
          }));
      })
      .slice(0, 5);
  }, [obligationsWithReminders]);

  const handleToggleReminder = async (obligationId: string, currentEnabled: boolean) => {
    const reminder = reminders.find(r => r.obligation_id === obligationId);
    if (reminder) {
      await updateReminder(obligationId, { email_enabled: !currentEnabled });
    } else {
      // Create new reminder config
      await createReminderForObligation(obligationId);
    }
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema di Promemoria</h1>
          <p className="text-muted-foreground">Configura e visualizza i promemoria per le scadenze</p>
        </div>

        {/* Info Card */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Sistema Attivo</p>
                <p className="text-sm text-muted-foreground">
                  I promemoria sono configurabili per ogni obbligo. Le notifiche email possono essere attivate 
                  collegando un servizio di invio email (es. Resend).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {obligations.filter(o => o.status !== 'completed').length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nessun obbligo attivo</p>
              <p className="text-sm text-muted-foreground">Aggiungi degli obblighi per configurare i promemoria</p>
            </CardContent>
          </Card>
        )}

        {obligationsWithReminders.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reminder Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Promemoria</CardTitle>
                <CardDescription>Attiva o disattiva i promemoria per ogni obbligo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {obligationsWithReminders.slice(0, 10).map((obl) => (
                    <div
                      key={obl.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{obl.title}</p>
                          <CategoryBadge category={obl.uiCategory as any} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {obl.daysUntil < 0
                              ? `${Math.abs(obl.daysUntil)} giorni scaduto`
                              : obl.daysUntil === 0
                              ? 'Scade oggi'
                              : `${obl.daysUntil} giorni rimanenti`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`reminder-${obl.id}`}
                            checked={obl.isEnabled}
                            onCheckedChange={() => handleToggleReminder(obl.id, obl.isEnabled)}
                          />
                          <Label htmlFor={`reminder-${obl.id}`} className="sr-only">
                            Abilita promemoria
                          </Label>
                        </div>
                        {obl.isEnabled ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reminder Intervals */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Intervalli di Promemoria</CardTitle>
                  <CardDescription>Quando vengono attivati i promemoria prima delle scadenze</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-bold text-primary">30</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">30 Giorni Prima</p>
                          <p className="text-xs text-muted-foreground">Promemoria di pianificazione</p>
                        </div>
                      </div>
                      <Badge variant="outline">Attivo</Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-bold text-primary">14</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">14 Giorni Prima</p>
                          <p className="text-xs text-muted-foreground">Promemoria di preparazione</p>
                        </div>
                      </div>
                      <Badge variant="outline">Attivo</Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-warning/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                          <span className="text-sm font-bold text-warning">7</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">7 Giorni Prima</p>
                          <p className="text-xs text-muted-foreground">Promemoria urgente</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-warning text-warning">Attenzione</Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                          <span className="text-sm font-bold text-destructive">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">1 Giorno Prima</p>
                          <p className="text-xs text-muted-foreground">Promemoria finale</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-destructive text-destructive">Critico</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle>Canali di Notifica</CardTitle>
                  <CardDescription>Come vengono consegnati i promemoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Notifiche Email</span>
                      </div>
                      <Badge variant="secondary">Configurabile</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Notifiche In-App</span>
                      </div>
                      <Badge>Attivo</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">SMS</span>
                      </div>
                      <Badge variant="outline">Prossimamente</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preview of Active Reminders */}
        {upcomingReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Promemoria Attivi</CardTitle>
              <CardDescription>
                Promemoria che verranno attivati prossimamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingReminders.map((reminder, index) => (
                  <div
                    key={`${reminder.obligation.id}-${reminder.triggerDays}-${index}`}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Promemoria: {reminder.obligation.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scadenza: {format(parseISO(reminder.obligation.deadline), 'dd MMMM yyyy')} 
                          ({reminder.obligation.daysUntil === 0 ? 'Oggi' : `${reminder.obligation.daysUntil} giorni rimanenti`})
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Assegnato a: {reminder.obligation.assigned_to || 'Non assegnato'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          reminder.triggerDays <= 1 
                            ? 'border-destructive text-destructive' 
                            : reminder.triggerDays <= 7 
                            ? 'border-warning text-warning' 
                            : ''
                        }
                      >
                        {reminder.triggerDays === 1 ? 'Finale' : `${reminder.triggerDays}g trigger`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted p-4">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> I promemoria vengono salvati nel database e possono essere configurati 
                  per inviare notifiche email automatiche collegando un servizio come Resend.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
