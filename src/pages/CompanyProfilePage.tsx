import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Edit, Trash2, User, Briefcase, Landmark } from 'lucide-react';
import { Company, Person, Project, CustomProperty } from '@/types';
import { getInitials, generatePastelColor, getAvatarUrl, formatInJakarta } from '@/lib/utils';
import CompanyFormDialog from '@/components/people/CompanyFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/StatusBadge';

type CompanyProfile = Company & {
  contacts: Person[];
  projects: Pick<Project, 'id' | 'name' | 'slug' | 'status'>[];
};

const CompanyProfileSkeleton = () => (
  <PortalLayout>
    <Skeleton className="h-8 w-32 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  </PortalLayout>
);

const CompanyProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: company, isLoading, error } = useQuery<CompanyProfile | null>({
    queryKey: ['company_details', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_company_details_by_slug', { p_slug: slug }).single();
      if (error) throw error;
      return data as CompanyProfile;
    },
    enabled: !!slug,
  });

  const { data: customProperties = [], isLoading: isLoadingCustomProperties } = useQuery<CustomProperty[]>({
    queryKey: ['custom_properties', 'company'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'company');
      if (error) throw error;
      return data;
    }
  });

  const renderCustomPropertyValue = (prop: CustomProperty, value: any) => {
    if (value === null || typeof value === 'undefined' || value === '') {
      return <span className="text-muted-foreground">-</span>;
    }
  
    switch (prop.type) {
      case 'url':
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{value}</a>;
      case 'email':
        return <a href={`mailto:${value}`} className="text-primary hover:underline truncate block">{value}</a>;
      case 'phone':
        return <a href={`tel:${value}`} className="text-primary hover:underline truncate block">{value}</a>;
      case 'image':
        return <img src={value} alt={prop.label} className="h-16 w-16 object-contain rounded-md mt-1" />;
      case 'date':
        try {
          return <span className="text-muted-foreground">{formatInJakarta(value, 'PPP')}</span>;
        } catch {
          return <span className="text-muted-foreground">{value}</span>;
        }
      case 'checkbox':
        return value ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>;
      default:
        return <span className="text-muted-foreground whitespace-pre-wrap">{String(value)}</span>;
    }
  };

  const { bankProperties, otherCustomProperties } = useMemo(() => {
    const bankPropertyLabels = [
      'bank account number',
      'bank beneficiary name',
      'bank account',
    ];
    const bankProps: CustomProperty[] = [];
    const otherProps: CustomProperty[] = [];

    customProperties.forEach(prop => {
        const hasValue = company?.custom_properties && typeof company.custom_properties[prop.name] !== 'undefined' && company.custom_properties[prop.name] !== null && company.custom_properties[prop.name] !== '';
        if (!hasValue) return;

        const labelLower = prop.label.toLowerCase().trim();
        if (bankPropertyLabels.includes(labelLower)) {
            bankProps.push(prop);
        } else {
            otherProps.push(prop);
        }
    });

    const order = ['bank beneficiary name', 'bank account', 'bank account number'];
    bankProps.sort((a, b) => {
        const aIndex = order.indexOf(a.label.toLowerCase().trim());
        const bIndex = order.indexOf(b.label.toLowerCase().trim());
        return aIndex - bIndex;
    });

    return { bankProperties: bankProps, otherCustomProperties: otherProps };
  }, [customProperties, company?.custom_properties]);

  const handleDelete = async () => {
    if (!company) return;
    const { error } = await supabase.from('companies').delete().eq('id', company.id);
    if (error) {
      toast.error(`Failed to delete ${company.name}.`, { description: error.message });
    } else {
      toast.success(`${company.name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/people?tab=companies');
    }
    setIsDeleteDialogOpen(false);
  };

  if (isLoading || isLoadingCustomProperties) return <CompanyProfileSkeleton />;
  if (error || !company) {
    toast.error("Could not load company profile.");
    navigate('/people?tab=companies');
    return null;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/people?tab=companies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={company.logo_url || ''} alt={company.name} />
                    <AvatarFallback className="rounded-lg"><Building className="h-8 w-8" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{company.legal_name}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(true)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{company.address}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contacts ({company.contacts.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {company.contacts.map(contact => (
                  <Link key={contact.id} to={`/people/${contact.slug}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(contact.avatar_url, contact.id)} />
                      <AvatarFallback style={generatePastelColor(contact.id)}>{getInitials(contact.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{contact.full_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {bankProperties.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-muted-foreground" /> Bank Information</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {bankProperties.map(prop => (
                    <div key={prop.id} className="flex items-start gap-3">
                      <span className="font-semibold w-32 flex-shrink-0">{prop.label}:</span>
                      <div className="flex-1 min-w-0">
                        {renderCustomPropertyValue(prop, company.custom_properties?.[prop.name])}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {otherCustomProperties.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {otherCustomProperties.map(prop => (
                    <div key={prop.id} className="flex items-start gap-3">
                      <span className="font-semibold w-24 flex-shrink-0">{prop.label}:</span>
                      <div className="flex-1 min-w-0">
                        {renderCustomPropertyValue(prop, company.custom_properties?.[prop.name])}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Projects ({company.projects.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {company.projects.map(project => (
                  <Link key={project.id} to={`/projects/${project.slug}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{project.name}</p>
                    </div>
                    <StatusBadge status={project.status as any} projectId={project.id} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CompanyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={company}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {company.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default CompanyProfilePage;