import { Layout } from '@/components/Layout';
import { TeamManagement } from '@/components/TeamManagement';

export default function Team() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Team</h1>
          <p className="text-muted-foreground">Gestisci i membri del team e i loro ruoli</p>
        </div>
        <TeamManagement />
      </div>
    </Layout>
  );
}
