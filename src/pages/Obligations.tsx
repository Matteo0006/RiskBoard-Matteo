import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge, RiskBadge, CategoryBadge } from '@/components/StatusBadge';
import { ObligationDialog } from '@/components/ObligationDialog';
import { useObligationsDB, categoryMap, reverseCategoryMap, type ObligationRow } from '@/hooks/useSupabaseData';
import { calculateDaysUntilDeadline, calculateRiskLevel, getRecurrenceLabel } from '@/lib/compliance';
import { Plus, Search, Pencil, Trash2, Filter, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { downloadComplianceReport } from '@/lib/pdfExport';
import { useCompanyDB } from '@/hooks/useSupabaseData';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ObligationCategory = Database['public']['Enums']['obligation_category'];
type ObligationStatus = Database['public']['Enums']['obligation_status'];

// Helper to convert DB obligation to UI format
const toUIFormat = (obl: ObligationRow) => ({
  ...obl,
  category: categoryMap[obl.category] || obl.category,
  recurrence: obl.frequency,
  penaltySeverity: obl.risk_level || 'medium',
  assignedTo: obl.assigned_to || '',
  description: obl.description || '',
  notes: obl.notes || '',
  createdAt: obl.created_at,
  updatedAt: obl.updated_at,
});

export default function Obligations() {
  const { obligations, isLoading, addObligation, updateObligation, deleteObligation } = useObligationsDB();
  const { company } = useCompanyDB();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<ObligationRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [obligationToDelete, setObligationToDelete] = useState<string | null>(null);

  const filteredObligations = useMemo(() => {
    return obligations.filter(obl => {
      const matchesSearch = obl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obl.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obl.assigned_to || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const oblCategory = categoryMap[obl.category] || obl.category;
      const matchesCategory = categoryFilter === 'all' || oblCategory === categoryFilter;
      const matchesStatus = statusFilter === 'all' || obl.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [obligations, searchQuery, categoryFilter, statusFilter]);

  const handleAddNew = () => {
    setEditingObligation(null);
    setDialogOpen(true);
  };

  const handleEdit = (obligation: ObligationRow) => {
    setEditingObligation(obligation);
    setDialogOpen(true);
  };

  const handleSave = async (data: {
    title: string;
    description: string;
    category: string;
    deadline: string;
    recurrence: string;
    status: string;
    assignedTo: string;
    penaltySeverity: string;
    notes?: string;
  }) => {
    const dbData = {
      title: data.title,
      description: data.description || null,
      category: reverseCategoryMap[data.category] || data.category as ObligationCategory,
      deadline: data.deadline,
      frequency: data.recurrence as Database['public']['Enums']['obligation_frequency'],
      status: data.status as ObligationStatus,
      assigned_to: data.assignedTo || null,
      risk_level: data.penaltySeverity as Database['public']['Enums']['risk_level'],
      notes: data.notes || null,
    };

    if (editingObligation) {
      await updateObligation(editingObligation.id, dbData);
    } else {
      await addObligation(dbData);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setObligationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (obligationToDelete) {
      await deleteObligation(obligationToDelete);
    }
    setDeleteConfirmOpen(false);
    setObligationToDelete(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Titolo', 'Descrizione', 'Categoria', 'Scadenza', 'Ricorrenza', 'Stato', 'Assegnato a', 'Rischio'];
    const rows = filteredObligations.map(obl => [
      obl.title,
      obl.description || '',
      categoryMap[obl.category] || obl.category,
      format(parseISO(obl.deadline), 'yyyy-MM-dd'),
      obl.frequency,
      obl.status,
      obl.assigned_to || '',
      obl.risk_level || 'medium',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `obblighi_compliance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({ title: 'Export completato', description: 'File CSV scaricato con successo' });
  };

  // Export to JSON (for Excel import)
  const exportToJSON = () => {
    const data = filteredObligations.map(obl => ({
      Titolo: obl.title,
      Descrizione: obl.description || '',
      Categoria: categoryMap[obl.category] || obl.category,
      Scadenza: format(parseISO(obl.deadline), 'yyyy-MM-dd'),
      Ricorrenza: obl.frequency,
      Stato: obl.status,
      'Assegnato a': obl.assigned_to || '',
      Rischio: obl.risk_level || 'medium',
      Note: obl.notes || '',
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `obblighi_compliance_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    
    toast({ title: 'Export completato', description: 'File JSON scaricato con successo' });
  };

  // Export to PDF
  const exportToPDF = () => {
    downloadComplianceReport(filteredObligations, company);
    toast({ title: 'Export completato', description: 'Report PDF scaricato con successo' });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Obblighi</h1>
            <p className="text-muted-foreground">Gestisci i tuoi obblighi di compliance e le scadenze</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJSON}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Obbligo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca obblighi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Categorie</SelectItem>
                    <SelectItem value="tax">Fiscale & Finanziario</SelectItem>
                    <SelectItem value="license">Licenze & Permessi</SelectItem>
                    <SelectItem value="regulatory">Normativo & Legale</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli Stati</SelectItem>
                    <SelectItem value="pending">In Attesa</SelectItem>
                    <SelectItem value="in_progress">In Corso</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="overdue">Scaduto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {obligations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                <p className="text-lg font-medium">Nessun obbligo presente</p>
                <p className="text-sm">Inizia aggiungendo il tuo primo obbligo di compliance</p>
              </div>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi il primo obbligo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Obligations Table */}
        {obligations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tutti gli Obblighi ({filteredObligations.length})</CardTitle>
              <CardDescription>
                Clicca su un obbligo per visualizzare i dettagli o usa i pulsanti azione per modificare o eliminare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Ricorrenza</TableHead>
                    <TableHead>Assegnato a</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Rischio</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObligations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nessun obbligo trovato con i filtri selezionati
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredObligations.map((obl) => {
                      const uiObl = toUIFormat(obl);
                      const daysUntil = calculateDaysUntilDeadline(obl.deadline);
                      const risk = calculateRiskLevel({
                        ...uiObl,
                        id: obl.id,
                        deadline: obl.deadline,
                        status: obl.status as any,
                        penaltySeverity: uiObl.penaltySeverity as any,
                      } as any);
                      
                      return (
                        <TableRow key={obl.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{obl.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{obl.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CategoryBadge category={uiObl.category as any} />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-foreground">{format(parseISO(obl.deadline), 'dd MMM yyyy')}</p>
                              <p className={`text-xs ${daysUntil < 0 ? 'text-destructive' : daysUntil <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                                {daysUntil < 0 ? `${Math.abs(daysUntil)}g scaduto` : daysUntil === 0 ? 'Oggi' : `${daysUntil}g rimanenti`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getRecurrenceLabel(obl.frequency)}
                          </TableCell>
                          <TableCell className="text-foreground">{obl.assigned_to || '-'}</TableCell>
                          <TableCell>
                            <StatusBadge status={obl.status as any} />
                          </TableCell>
                          <TableCell>
                            <RiskBadge risk={risk} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(obl)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(obl.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <ObligationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        obligation={editingObligation ? toUIFormat(editingObligation) as any : null}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Obbligo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo obbligo? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
