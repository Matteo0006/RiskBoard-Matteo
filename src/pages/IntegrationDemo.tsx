import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Webhook, ArrowRight, Database, Lock, RefreshCw, Info, ExternalLink } from 'lucide-react';

export default function IntegrationDemo() {
  const sampleApiResponse = {
    success: true,
    data: {
      obligations: [
        {
          id: "obl-001",
          title: "Quarterly VAT Return",
          category: "tax",
          deadline: "2025-01-02",
          status: "in_progress",
          risk_level: "high"
        }
      ],
      pagination: {
        total: 16,
        page: 1,
        per_page: 10
      }
    }
  };

  const webhookPayload = {
    event: "obligation.deadline_approaching",
    timestamp: "2024-12-27T09:00:00Z",
    data: {
      obligation_id: "obl-001",
      title: "Quarterly VAT Return",
      deadline: "2025-01-02",
      days_remaining: 6,
      assigned_to: "Finance Team"
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integration Demo</h1>
          <p className="text-muted-foreground">
            Demonstration of how this system could integrate with existing business software
          </p>
        </div>

        {/* Disclaimer */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Integration Mockup</p>
                <p className="text-sm text-muted-foreground">
                  This page demonstrates how a compliance tracking system would integrate with other 
                  business applications. The API endpoints and webhooks shown are illustrative examples.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Architecture</CardTitle>
            <CardDescription>How ComplianceTrack would connect with your existing systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-foreground">Your Systems</h4>
                <p className="text-xs text-muted-foreground mt-1">ERP, CRM, Accounting Software</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="mx-4 rounded-lg bg-primary/10 px-4 py-2">
                  <p className="text-xs font-medium text-primary">REST API</p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-foreground">ComplianceTrack</h4>
                <p className="text-xs text-muted-foreground mt-1">Centralized Compliance Hub</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Tabs defaultValue="endpoints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="embed">Embed Widget</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  <CardTitle>REST API Endpoints</CardTitle>
                </div>
                <CardDescription>
                  Sample endpoints for programmatic access to compliance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GET Obligations */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
                    <Badge className="bg-success text-success-foreground">GET</Badge>
                    <code className="text-sm font-mono">/api/v1/obligations</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Retrieve a list of all compliance obligations with filtering options
                    </p>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-2">Sample Response:</p>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(sampleApiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* POST Obligation */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
                    <Badge className="bg-primary text-primary-foreground">POST</Badge>
                    <code className="text-sm font-mono">/api/v1/obligations</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Create a new compliance obligation
                    </p>
                  </div>
                </div>

                {/* PUT Obligation */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
                    <Badge className="bg-warning text-warning-foreground">PUT</Badge>
                    <code className="text-sm font-mono">/api/v1/obligations/:id</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Update an existing obligation
                    </p>
                  </div>
                </div>

                {/* DELETE Obligation */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
                    <Badge className="bg-danger text-danger-foreground">DELETE</Badge>
                    <code className="text-sm font-mono">/api/v1/obligations/:id</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Remove an obligation from the system
                    </p>
                  </div>
                </div>

                {/* GET Dashboard */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
                    <Badge className="bg-success text-success-foreground">GET</Badge>
                    <code className="text-sm font-mono">/api/v1/dashboard/stats</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Retrieve dashboard statistics and compliance score
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  <CardTitle>Webhook Events</CardTitle>
                </div>
                <CardDescription>
                  Real-time notifications for compliance events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-primary">obligation.created</code>
                      <Badge variant="outline">Event</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a new obligation is added to the system
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-primary">obligation.deadline_approaching</code>
                      <Badge variant="outline">Event</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Triggered at configured intervals before deadline
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-primary">obligation.overdue</code>
                      <Badge variant="outline">Event</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Triggered when an obligation passes its deadline
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-primary">obligation.completed</code>
                      <Badge variant="outline">Event</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Triggered when an obligation is marked as completed
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-foreground mb-2">Sample Webhook Payload:</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(webhookPayload, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <CardTitle>Embeddable Widget</CardTitle>
                </div>
                <CardDescription>
                  Embed compliance status in your existing dashboards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-foreground mb-2">Embed Code:</p>
                  <pre className="text-xs overflow-x-auto bg-card p-3 rounded border">
{`<!-- ComplianceTrack Widget -->
<iframe 
  src="https://app.compliancetrack.demo/embed/dashboard"
  width="100%" 
  height="400"
  frameborder="0"
  title="Compliance Dashboard"
></iframe>`}
                  </pre>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Widget Preview</p>
                  <div className="rounded-lg border-2 border-dashed bg-muted/50 p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-card p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-foreground">87%</p>
                        <p className="text-xs text-muted-foreground">Compliance Score</p>
                      </div>
                      <div className="rounded-lg bg-card p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-warning">4</p>
                        <p className="text-xs text-muted-foreground">Due This Week</p>
                      </div>
                      <div className="rounded-lg bg-card p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-danger">2</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted p-4">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    The embeddable widget can be customized to show specific metrics and can be 
                    styled to match your existing dashboard theme.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Flow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Data Flow</CardTitle>
            <CardDescription>How compliance data flows through integrated systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4 py-6">
              <div className="rounded-lg border bg-card p-4 text-center min-w-[120px]">
                <Database className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Source Systems</p>
                <p className="text-xs text-muted-foreground">ERP, CRM</p>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center min-w-[120px]">
                <RefreshCw className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Sync</p>
                <p className="text-xs text-muted-foreground">API/Import</p>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              
              <div className="rounded-lg border bg-card p-4 text-center min-w-[120px]">
                <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">ComplianceTrack</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              
              <div className="rounded-lg border bg-card p-4 text-center min-w-[120px]">
                <Webhook className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Webhooks</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
