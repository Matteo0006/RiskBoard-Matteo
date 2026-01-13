import { useState } from 'react';
import { Users, Mail, Crown, Shield, Eye, UserPlus, Trash2, MoreHorizontal, Clock, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useTeamManagement, TeamMember } from '@/hooks/useTeamManagement';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type CompanyRole = Database['public']['Enums']['company_role'];

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', description: 'Pieno controllo' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', description: 'Gestione team e obblighi' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-muted text-muted-foreground border-muted', description: 'Solo lettura e commenti' },
};

export function TeamManagement() {
  const { members, invitations, loading, inviteMember, updateMemberRole, removeMember, cancelInvitation } = useTeamManagement();
  const { currentCompany, canManage, isOwner } = useCompanyContext();
  const { user } = useAuth();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<TeamMember | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    
    setInviteLoading(true);
    const success = await inviteMember(inviteEmail, inviteRole);
    if (success) {
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteDialogOpen(false);
    }
    setInviteLoading(false);
  };

  const handleRemoveMember = async () => {
    if (!removeMemberDialog) return;
    await removeMember(removeMemberDialog.id);
    setRemoveMemberDialog(null);
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestione Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Seleziona un'azienda per gestire il team.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team di {currentCompany.name}
            </CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'membro' : 'membri'} nel team
            </CardDescription>
          </div>
          {canManage && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invita un nuovo membro</DialogTitle>
                  <DialogDescription>
                    Inserisci l'email del nuovo membro e seleziona il suo ruolo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="nome@azienda.it"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ruolo</label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CompanyRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span>Admin</span>
                            <span className="text-muted-foreground text-xs">- Gestione team e obblighi</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>Viewer</span>
                            <span className="text-muted-foreground text-xs">- Solo lettura e commenti</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleInvite} disabled={!inviteEmail || inviteLoading}>
                    {inviteLoading ? 'Invio...' : 'Invia invito'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membri</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const RoleIcon = roleConfig[member.role].icon;
                const isCurrentUser = member.user_id === user?.id;
                const canModify = canManage && !isCurrentUser && member.role !== 'owner';

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.full_name?.[0] || member.profile?.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {member.profile?.full_name || 'Utente'}
                          {isCurrentUser && <span className="text-muted-foreground ml-1">(tu)</span>}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.profile?.email}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('flex-shrink-0', roleConfig[member.role].color)}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleConfig[member.role].label}
                    </Badge>
                    {canModify && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                            <Shield className="h-4 w-4 mr-2 text-blue-600" />
                            Imposta Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                            <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                            Imposta Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRemoveMemberDialog(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Rimuovi dal team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inviti in sospeso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((invitation) => {
                const RoleIcon = roleConfig[invitation.role].icon;
                const isExpired = new Date(invitation.expires_at) < new Date();

                return (
                  <div
                    key={invitation.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isExpired ? "bg-muted/50 opacity-60" : "bg-card"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {isExpired ? 'Scaduto' : `Scade ${format(new Date(invitation.expires_at), "d MMM yyyy", { locale: it })}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('flex-shrink-0', roleConfig[invitation.role].color)}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleConfig[invitation.role].label}
                    </Badge>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => cancelInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Dialog */}
      <AlertDialog open={!!removeMemberDialog} onOpenChange={() => setRemoveMemberDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovi membro</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere {removeMemberDialog?.profile?.full_name || removeMemberDialog?.profile?.email} dal team?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90">
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
