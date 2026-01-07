import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyDB } from '@/hooks/useSupabaseData';
import { Building2, Mail, Phone, MapPin, User, FileText, Save, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FormData {
  name: string;
  registration_number: string;
  vat_number: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  employee_count: number;
  fiscal_year_end: string;
}

export default function CompanyProfile() {
  const { company, isLoading, saveCompany, deleteCompany } = useCompanyDB();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    registration_number: '',
    vat_number: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: 'Italia',
    employee_count: 0,
    fiscal_year_end: '12-31',
  });

  // Sync form data with company data
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        registration_number: company.registration_number || '',
        vat_number: company.vat_number || '',
        industry: company.industry || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || 'Italia',
        employee_count: company.employee_count || 0,
        fiscal_year_end: company.fiscal_year_end || '12-31',
      });
    }
  }, [company]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        registration_number: company.registration_number || '',
        vat_number: company.vat_number || '',
        industry: company.industry || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || 'Italia',
        employee_count: company.employee_count || 0,
        fiscal_year_end: company.fiscal_year_end || '12-31',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    await saveCompany({
      name: formData.name,
      registration_number: formData.registration_number || null,
      vat_number: formData.vat_number || null,
      industry: formData.industry || null,
      email: formData.email || null,
      phone: formData.phone || null,
      website: formData.website || null,
      address: formData.address || null,
      city: formData.city || null,
      country: formData.country || 'Italia',
      employee_count: formData.employee_count || null,
      fiscal_year_end: formData.fiscal_year_end || '12-31',
    });
    setIsEditing(false);
  };

  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasData = company !== null;

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINA') return;
    
    setIsDeleting(true);
    const success = await deleteCompany();
    setIsDeleting(false);
    
    if (success) {
      setConfirmText('');
      setFormData({
        name: '',
        registration_number: '',
        vat_number: '',
        industry: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        country: 'Italia',
        employee_count: 0,
        fiscal_year_end: '12-31',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profilo Aziendale</h1>
            <p className="text-muted-foreground">Gestisci le informazioni della tua organizzazione</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Annulla
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salva
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleEdit}>
                {hasData ? 'Modifica' : 'Configura Profilo'}
              </Button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!hasData && !isEditing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nessun profilo aziendale configurato</p>
              <p className="text-muted-foreground mb-4">Configura il profilo della tua azienda per iniziare</p>
              <Button onClick={handleEdit}>
                Configura Profilo
              </Button>
            </CardContent>
          </Card>
        )}

        {(hasData || isEditing) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Informazioni Azienda</CardTitle>
                </div>
                <CardDescription>Dati societari e registrazione</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Azienda *</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Inserisci il nome dell'azienda"
                    />
                  ) : (
                    <p className="text-foreground font-medium">{formData.name || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="registration_number">Numero REA / Registro Imprese</Label>
                  {isEditing ? (
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => updateField('registration_number', e.target.value)}
                      placeholder="Es. MI-1234567"
                    />
                  ) : (
                    <p className="text-foreground">{formData.registration_number || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vat_number">Partita IVA</Label>
                  {isEditing ? (
                    <Input
                      id="vat_number"
                      value={formData.vat_number}
                      onChange={(e) => updateField('vat_number', e.target.value)}
                      placeholder="Es. IT12345678901"
                    />
                  ) : (
                    <p className="text-foreground">{formData.vat_number || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry">Settore</Label>
                  {isEditing ? (
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      placeholder="Es. Tecnologia, Manifatturiero, Servizi"
                    />
                  ) : (
                    <p className="text-foreground">{formData.industry || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle>Contatti</CardTitle>
                </div>
                <CardDescription>Recapiti per comunicazioni di compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="compliance@azienda.it"
                    />
                  ) : (
                    <p className="text-foreground">{formData.email || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefono</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+39 02 1234567"
                    />
                  ) : (
                    <p className="text-foreground">{formData.phone || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Sito Web</Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.azienda.it"
                    />
                  ) : (
                    <p className="text-foreground">{formData.website || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Sede Legale</CardTitle>
                </div>
                <CardDescription>Indirizzo registrato dell'azienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Via Roma, 1"
                    />
                  ) : (
                    <p className="text-foreground">{formData.address || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Città</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="Milano"
                      />
                    ) : (
                      <p className="text-foreground">{formData.city || '-'}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Paese</Label>
                    {isEditing ? (
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="Italia"
                      />
                    ) : (
                      <p className="text-foreground">{formData.country || '-'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Altre Informazioni</CardTitle>
                </div>
                <CardDescription>Dati aggiuntivi per la compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee_count">Numero Dipendenti</Label>
                  {isEditing ? (
                    <Input
                      id="employee_count"
                      type="number"
                      value={formData.employee_count}
                      onChange={(e) => updateField('employee_count', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-foreground">{formData.employee_count || '-'}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fiscal_year_end">Fine Anno Fiscale</Label>
                  {isEditing ? (
                    <Input
                      id="fiscal_year_end"
                      value={formData.fiscal_year_end}
                      onChange={(e) => updateField('fiscal_year_end', e.target.value)}
                      placeholder="12-31"
                    />
                  ) : (
                    <p className="text-foreground">{formData.fiscal_year_end || '12-31'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Categorie di Compliance</CardTitle>
            </div>
            <CardDescription>
              In base al tuo settore, queste sono le aree di compliance tipiche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Fiscale & Finanziario</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dichiarazioni fiscali</li>
                  <li>• IVA e imposte</li>
                  <li>• Contributi previdenziali</li>
                  <li>• Bilanci e audit</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Licenze & Permessi</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Licenze commerciali</li>
                  <li>• Certificazioni professionali</li>
                  <li>• Rinnovi assicurativi</li>
                  <li>• Iscrizioni albi</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Normativo & Legale</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• GDPR e privacy</li>
                  <li>• Sicurezza sul lavoro</li>
                  <li>• Rapporti ambientali</li>
                  <li>• Normative di settore</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Delete Company */}
        {hasData && (
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
              </div>
              <CardDescription>
                Azioni irreversibili per il tuo profilo aziendale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <h4 className="font-semibold text-foreground">Elimina Profilo Aziendale</h4>
                  <p className="text-sm text-muted-foreground">
                    Una volta eliminato, tutti i dati aziendali saranno persi permanentemente.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Conferma Eliminazione
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          Stai per eliminare definitivamente il profilo aziendale <strong>"{company?.name}"</strong>. 
                          Questa azione è <strong>irreversibile</strong>.
                        </p>
                        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-sm font-medium text-destructive">
                            ⚠️ I seguenti dati saranno eliminati:
                          </p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Tutti i dati aziendali</li>
                            <li>• Informazioni di contatto</li>
                            <li>• Configurazioni associate</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-delete" className="text-sm font-medium">
                            Digita <span className="font-mono bg-muted px-1 rounded">ELIMINA</span> per confermare:
                          </Label>
                          <Input
                            id="confirm-delete"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="Digita ELIMINA"
                            className="font-mono"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmText('')}>
                        Annulla
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={confirmText !== 'ELIMINA' || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Eliminazione...' : 'Elimina Definitivamente'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
