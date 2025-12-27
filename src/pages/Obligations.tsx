import { useState, useMemo } from 'react';
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
import { useObligations } from '@/hooks/useComplianceData';
import { calculateDaysUntilDeadline, calculateRiskLevel, getRecurrenceLabel } from '@/lib/compliance';
import { Plus, Search, RotateCcw, Pencil, Trash2, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Obligation, ObligationCategory, ObligationStatus } from '@/types/compliance';

export default function Obligations() {
  const { obligations, isLoading, addObligation, updateObligation, deleteObligation, resetToSample } = useObligations();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [obligationToDelete, setObligationToDelete] = useState<string | null>(null);

  const filteredObligations = useMemo(() => {
    return obligations.filter(obl => {
      const matchesSearch = obl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obl.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || obl.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || obl.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [obligations, searchQuery, categoryFilter, statusFilter]);

  const handleAddNew = () => {
    setEditingObligation(null);
    setDialogOpen(true);
  };

  const handleEdit = (obligation: Obligation) => {
    setEditingObligation(obligation);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingObligation) {
      updateObligation(editingObligation.id, data);
      toast({ title: 'Obligation updated', description: 'Changes have been saved.' });
    } else {
      addObligation(data);
      toast({ title: 'Obligation added', description: 'New obligation has been created.' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setObligationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (obligationToDelete) {
      deleteObligation(obligationToDelete);
      toast({ title: 'Obligation deleted', description: 'The obligation has been removed.' });
    }
    setDeleteConfirmOpen(false);
    setObligationToDelete(null);
  };

  const handleReset = () => {
    resetToSample();
    toast({ title: 'Data reset', description: 'Obligations have been reset to sample data.' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Obligations</h1>
            <p className="text-muted-foreground">Manage your compliance obligations and deadlines</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Obligation
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
                    placeholder="Search obligations..."
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
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tax">Tax & Financial</SelectItem>
                    <SelectItem value="license">Licenses & Permits</SelectItem>
                    <SelectItem value="regulatory">Regulatory & Legal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Obligations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Obligations ({filteredObligations.length})</CardTitle>
            <CardDescription>
              Click on an obligation to view details or use the action buttons to edit or delete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No obligations found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredObligations.map((obl) => {
                    const daysUntil = calculateDaysUntilDeadline(obl.deadline);
                    const risk = calculateRiskLevel(obl);
                    return (
                      <TableRow key={obl.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{obl.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{obl.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={obl.category} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{format(parseISO(obl.deadline), 'MMM d, yyyy')}</p>
                            <p className={`text-xs ${daysUntil < 0 ? 'text-danger' : daysUntil <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Today' : `${daysUntil}d left`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getRecurrenceLabel(obl.recurrence)}
                        </TableCell>
                        <TableCell className="text-foreground">{obl.assignedTo}</TableCell>
                        <TableCell>
                          <StatusBadge status={obl.status} />
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
      </div>

      {/* Add/Edit Dialog */}
      <ObligationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        obligation={editingObligation}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Obligation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this obligation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
