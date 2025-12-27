import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyProfile } from '@/hooks/useComplianceData';
import { Building2, Mail, Phone, MapPin, User, FileText, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanyProfile() {
  const { company, isLoading, updateCompany, resetToSample } = useCompanyProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(company);

  if (isLoading || !company) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const handleEdit = () => {
    setFormData(company);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (formData) {
      updateCompany(formData);
      setIsEditing(false);
      toast({
        title: 'Company profile updated',
        description: 'Your changes have been saved successfully.',
      });
    }
  };

  const handleReset = () => {
    resetToSample();
    setFormData(company);
    setIsEditing(false);
    toast({
      title: 'Profile reset',
      description: 'Company profile has been reset to sample data.',
    });
  };

  const displayData = isEditing ? formData : company;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
            <p className="text-muted-foreground">Manage your organization's compliance information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Sample
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Company Information</CardTitle>
              </div>
              <CardDescription>Basic company details and registration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Company Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData?.name || ''}
                    onChange={(e) => setFormData({ ...formData!, name: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground font-medium">{displayData?.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                {isEditing ? (
                  <Input
                    id="registrationNumber"
                    value={formData?.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData!, registrationNumber: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.registrationNumber}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industrySector">Industry Sector</Label>
                {isEditing ? (
                  <Input
                    id="industrySector"
                    value={formData?.industrySector || ''}
                    onChange={(e) => setFormData({ ...formData!, industrySector: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.industrySector}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Contact Information</CardTitle>
              </div>
              <CardDescription>Primary contact details for compliance matters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData?.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData!, contactEmail: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.contactEmail}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="contactPhone"
                    value={formData?.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData!, contactPhone: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.contactPhone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Address</CardTitle>
              </div>
              <CardDescription>Registered business address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Street Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData?.address || ''}
                    onChange={(e) => setFormData({ ...formData!, address: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.address}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={formData?.city || ''}
                      onChange={(e) => setFormData({ ...formData!, city: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{displayData?.city}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  {isEditing ? (
                    <Input
                      id="country"
                      value={formData?.country || ''}
                      onChange={(e) => setFormData({ ...formData!, country: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{displayData?.country}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsible Person */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Responsible Person</CardTitle>
              </div>
              <CardDescription>Primary compliance officer or responsible party</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="responsiblePerson">Name</Label>
                {isEditing ? (
                  <Input
                    id="responsiblePerson"
                    value={formData?.responsiblePerson || ''}
                    onChange={(e) => setFormData({ ...formData!, responsiblePerson: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground font-medium">{displayData?.responsiblePerson}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsiblePersonTitle">Title</Label>
                {isEditing ? (
                  <Input
                    id="responsiblePersonTitle"
                    value={formData?.responsiblePersonTitle || ''}
                    onChange={(e) => setFormData({ ...formData!, responsiblePersonTitle: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{displayData?.responsiblePersonTitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Industry Compliance Categories</CardTitle>
            </div>
            <CardDescription>
              Based on your industry sector, these are the typical compliance areas that apply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Tax & Financial</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Corporate tax filings</li>
                  <li>• VAT/Sales tax returns</li>
                  <li>• Payroll taxes</li>
                  <li>• Financial audits</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Licenses & Permits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Business licenses</li>
                  <li>• Professional certifications</li>
                  <li>• Insurance renewals</li>
                  <li>• Trade memberships</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground mb-2">Regulatory & Legal</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data protection (GDPR)</li>
                  <li>• Health & safety</li>
                  <li>• Environmental reports</li>
                  <li>• Industry regulations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
