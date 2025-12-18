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
import { ArrowLeft, Building, Edit, Trash2, MapPin, Briefcase, Landmark, ExternalLink } from 'lucide-react';
import { Company, Person, Project, CustomProperty } from '@/types';
import { getInitials, generatePastelColor, getAvatarUrl, formatInJakarta } from '@/lib/utils';
import CompanyFormDialog from '@/components/people/CompanyFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
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

  const isAdmin = user?.role === 'admin' || user?.role === 'master admin';
  const canViewBankInfo = user?.role === 'master admin' || user?.role === 'finance';

  const renderCustomPropertyValue = (prop: CustomProperty, value: any) => {
    if (value === null || typeof value === 'undefined' || value === '') {
      return <span className="text-muted-foreground">-</span>;
    }
  
    switch (prop.type) {
      case 'url':
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block flex items-center gap-1">{value} <ExternalLink className="h-3 w-3 inline" /></a>;
      case 'email':
        return <a href={`mailto:${value}`} className="text-primary hover:underline truncate block">{value}</a>;
      case 'phone':
        return <a href={`tel:${value}`} className="text-primary hover:underline truncate block">{value}</a>;
      case 'image':
        return <img src={value} alt={prop.label} className="h-16 w-16 object-contain rounded-md mt-1 border bg-white" />;
      case 'date':
        try {
          return <span className="text-foreground">{formatInJakarta(value, 'PPP')}</span>;
        } catch {
          return <span className="text-foreground">{value}</span>;
        }
      case 'checkbox':
        return value ? <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs border border-green-200">Yes</span> : <span className="text-muted-foreground bg-gray-100 px-2 py-0.5 rounded text-xs">No</span>;
      default:
        return <span className="text-foreground whitespace-pre-wrap">{String(value)}</span>;
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
      <div className="space-y-6 max-w-7xl mx-auto">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground pl-0" onClick={() => navigate('/people?tab=companies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Basic Info & Contacts */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 border-b"></div>
              <CardHeader className="relative pb-2">
                <div className="absolute -top-12 left-6">
                  <Avatar className="h-24 w-24 rounded-xl border-4 border-background shadow-sm bg-white">
                    <AvatarImage src={company.logo_url || ''} alt={company.name} className="object-contain p-1" />
                    <AvatarFallback className="rounded-xl text-2xl bg-muted text-muted-foreground">
                      <Building className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="pt-12 flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{company.name}</CardTitle>
                    {company.legal_name && (
                      <p className="text-sm text-muted-foreground mt-1 font-medium">{company.legal_name}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 -mr-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {company.address ? (
                  <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs uppercase tracking-wider">Address</p>
                      <p className="leading-relaxed">{company.address}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        View on Map <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No address provided</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-primary/10 text-primary p-1.5 rounded-md"><Briefcase className="h-4 w-4" /></span>
                  Key Contacts 
                  <span className="ml-auto text-xs font-normal bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{company.contacts.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {company.contacts.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {company.contacts.map(contact => (
                      <Link 
                        key={contact.id} 
                        to={`/people/${contact.slug}`} 
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                      >
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={getAvatarUrl(contact.avatar_url, contact.id)} />
                          <AvatarFallback style={generatePastelColor(contact.id)}>{getInitials(contact.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{contact.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{contact.job_title || 'No title'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No contacts associated yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details & Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {canViewBankInfo && bankProperties.length > 0 && (
                <Card className="border-border/50 shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border/50 bg-green-50/50">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-700">
                      <Landmark className="h-4 w-4" /> Bank Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {bankProperties.map(prop => (
                      <div key={prop.id} className="group">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{prop.label}</p>
                        <div className="text-sm font-medium text-foreground break-all bg-white border border-border/50 rounded px-3 py-2 shadow-sm group-hover:border-green-200 transition-colors">
                          {renderCustomPropertyValue(prop, company.custom_properties?.[prop.name])}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {otherCustomProperties.length > 0 && (
                <Card className={!canViewBankInfo || bankProperties.length === 0 ? "md:col-span-2 border-border/50 shadow-sm" : "border-border/50 shadow-sm h-full"}>
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      Additional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid gap-4">
                    {otherCustomProperties.map(prop => (
                      <div key={prop.id} className="group flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-muted-foreground font-medium">{prop.label}</span>
                        <div className="text-sm font-medium text-foreground text-right max-w-[60%]">
                          {renderCustomPropertyValue(prop, company.custom_properties?.[prop.name])}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-1.5 rounded-md"><Briefcase className="h-4 w-4" /></span>
                    Associated Projects
                  </div>
                  <span className="text-xs font-normal bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{company.projects.length} Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {company.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.projects.map(project => (
                      <Link 
                        key={project.id} 
                        to={`/projects/${project.slug}`} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all group bg-card"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <p className="font-medium text-sm truncate">{project.name}</p>
                        </div>
                        <StatusBadge status={project.status as any} projectId={project.id} className="scale-90" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No active projects with this company.</p>
                  </div>
                )}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default CompanyProfilePage;