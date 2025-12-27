import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useObligations, useReminderConfigs } from '@/hooks/useComplianceData';
import { calculateDaysUntilDeadline } from '@/lib/compliance';
import { CategoryBadge } from '@/components/StatusBadge';
import { Bell, BellOff, Clock, AlertTriangle, Info, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Reminders() {
  const { obligations, isLoading: oblLoading } = useObligations();
  const { reminders, isLoading: remLoading, updateReminder } = useReminderConfigs();

  if (oblLoading || remLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Combine obligations with their reminder configs
  const obligationsWithReminders = obligations
    .filter(obl => obl.status !== 'completed')
    .map(obl => {
      const reminder = reminders.find(r => r.obligationId === obl.id);
      return {
        ...obl,
        daysUntil: calculateDaysUntilDeadline(obl.deadline),
        reminderConfig: reminder || { obligationId: obl.id, reminderDays: [30, 14, 7, 1], enabled: true },
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Mock upcoming reminders (for visual demonstration)
  const upcomingReminders = obligationsWithReminders
    .filter(obl => obl.reminderConfig.enabled)
    .flatMap(obl => {
      return obl.reminderConfig.reminderDays
        .filter(days => obl.daysUntil <= days && obl.daysUntil >= 0)
        .map(days => ({
          obligation: obl,
          triggerDays: days,
          isTriggered: obl.daysUntil <= days,
        }));
    })
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reminder System</h1>
          <p className="text-muted-foreground">Configure and preview deadline reminders</p>
        </div>

        {/* Disclaimer */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Visual Demonstration Only</p>
                <p className="text-sm text-muted-foreground">
                  This reminder system is a visual demonstration. No actual notifications will be sent. 
                  In a production system, these would integrate with email, SMS, or push notification services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Reminder Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Reminder Configuration</CardTitle>
              <CardDescription>Toggle reminders on or off for each obligation</CardDescription>
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
                        <CategoryBadge category={obl.category} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {obl.daysUntil < 0
                            ? `${Math.abs(obl.daysUntil)} days overdue`
                            : obl.daysUntil === 0
                            ? 'Due today'
                            : `${obl.daysUntil} days left`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`reminder-${obl.id}`}
                          checked={obl.reminderConfig.enabled}
                          onCheckedChange={(checked) => 
                            updateReminder(obl.id, { enabled: checked })
                          }
                        />
                        <Label htmlFor={`reminder-${obl.id}`} className="sr-only">
                          Enable reminders
                        </Label>
                      </div>
                      {obl.reminderConfig.enabled ? (
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
                <CardTitle>Reminder Intervals</CardTitle>
                <CardDescription>When reminders would be triggered before deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">30</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">30 Days Before</p>
                        <p className="text-xs text-muted-foreground">Initial planning reminder</p>
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">14</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">14 Days Before</p>
                        <p className="text-xs text-muted-foreground">Preparation reminder</p>
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-warning/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                        <span className="text-sm font-bold text-warning">7</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">7 Days Before</p>
                        <p className="text-xs text-muted-foreground">Urgent action reminder</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">Warning</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-danger/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/20">
                        <span className="text-sm font-bold text-danger">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">1 Day Before</p>
                        <p className="text-xs text-muted-foreground">Final deadline reminder</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-danger text-danger">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Channels (Mock) */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>How reminders would be delivered (demonstration)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Email Notifications</span>
                    </div>
                    <Badge variant="secondary">Demo</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">In-App Notifications</span>
                    </div>
                    <Badge variant="secondary">Demo</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">SMS Alerts</span>
                    </div>
                    <Badge variant="secondary">Demo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview of Active Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Active Reminder Preview</CardTitle>
            <CardDescription>
              What reminder notifications would look like if this were a production system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active reminder triggers at this time</p>
              </div>
            ) : (
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
                          Reminder: {reminder.obligation.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Deadline: {format(parseISO(reminder.obligation.deadline), 'MMMM d, yyyy')} 
                          ({reminder.obligation.daysUntil === 0 ? 'Today' : `${reminder.obligation.daysUntil} days remaining`})
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Assigned to: {reminder.obligation.assignedTo}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          reminder.triggerDays <= 1 
                            ? 'border-danger text-danger' 
                            : reminder.triggerDays <= 7 
                            ? 'border-warning text-warning' 
                            : ''
                        }
                      >
                        {reminder.triggerDays === 1 ? 'Final' : `${reminder.triggerDays}d trigger`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted p-4">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a visual preview only. In a production implementation, 
                these reminders would be sent via email, SMS, or push notifications based on the configured 
                channels and intervals.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
