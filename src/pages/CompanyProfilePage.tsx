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
import { ArrowLeft, Building, Edit, Trash2, User, Briefcase, Landmark, MapPin, Copy, MoreVertical, CreditCard } from 'lucide-react';
import { Company, Person, Project, CustomProperty, BankAccount, PaymentStatus } from '@/types';
import { getInitials, generatePastelColor, getAvatarUrl, formatInJakarta } from '@/lib/utils';
import CompanyFormDialog from '@/components/people/CompanyFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/StatusBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { getPaymentStatusStyles } from '@/lib/utils';

type CompanyProfile = Company & {
  contacts: Person[];
  projects: (Pick<Project, 'id' | 'name' | 'slug' | 'status'> & { payment_status: PaymentStatus, budget: number | null })[];
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
      // Fetch details with projects including payment info
      const { data, error } = await supabase.rpc('get_company_details_by_slug', { p_slug: slug }).single();
      
      // Need to refetch projects to include budget and payment_status which might not be in the simple RPC view
      if (data && data.id) {
         const { data: projects } = await supabase.from('projects')
            .select('id, name, slug, status, payment_status, budget')
            .eq('client_company_id', data.id)
            .order('created_at', { ascending: false });
         
         if (projects) {
             (data as any).projects = projects;
         }
      }

      if (error) throw error;
      return data as CompanyProfile;
    },
    enabled: !!slug,
  });

  const companyId = company?.id;

  const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery<BankAccount[]>({
    queryKey: ['company_bank_accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('bank_accounts').select('*').eq('owner_id', companyId).eq('owner_type', 'company');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
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

  // Filter out any custom properties that are typically bank-related, as we now use the dedicated table.
  const otherCustomProperties = useMemo(() => {
    const bankPropertyNames = [
      'bank_account_number',
      'bank_beneficiary_name',
      'bank_account',
      'bank_name',
    ];
    
    return customProperties.filter(prop => {
        const hasValue = company?.custom_properties && typeof company.custom_properties[prop.name] !== 'undefined' && company.custom_properties[prop.name] !== null && company.custom_properties[prop.name] !== '';
        if (!hasValue) return false;
        
        return !bankPropertyNames.includes(prop.name.toLowerCase().trim());
    });
  }, [customProperties, company?.custom_properties]);

  const addressObject = useMemo(() => {
    if (!company?.address) return null;
    
    // If it's already an object (from JSONB column)
    if (typeof company.address === 'object' && company.address !== null) {
      return company.address as { name?: string; address?: string };
    }
    
    // If it's a string, try to parse it as JSON, otherwise treat as plain string
    if (typeof company.address === 'string') {
      try {
        const parsed = JSON.parse(company.address);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as { name?: string; address?: string };
        }
      } catch (e) {
        // Not a JSON string, treat as simple address string
      }
      return { address: company.address };
    }
    
    return null;
  }, [company?.address]);

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

  const handleCopyBankDetails = (account: BankAccount) => {
    const textToCopy = `
Account Name: ${account.account_name}
Bank Name: ${account.bank_name}
Account Number: ${account.account_number}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success("Bank details copied to clipboard.");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy bank details.");
    });
  };

  const pendingInvoices = useMemo(() => {
     if (!company?.projects) return [];
     return company.projects.filter(p => ['Unpaid', 'Overdue', 'Pending', 'Proposed'].includes(p.payment_status));
  }, [company?.projects]);

  if (isLoading || isLoadingCustomProperties || isLoadingBankAccounts) return <CompanyProfileSkeleton />;
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {addressObject ? (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      {addressObject.name && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressObject.name + ' ' + (addressObject.address || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline block"
                        >
                          {addressObject.name}
                        </a>
                      )}
                      {addressObject.address && (
                        <p className={addressObject.name ? "text-muted-foreground" : ""}>
                          {!addressObject.name ? (
                             <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressObject.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {addressObject.address}
                            </a>
                          ) : addressObject.address}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center italic">No address provided</p>
                )}
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
            {/* New Billing Section */}
            {pendingInvoices.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-orange-800"><CreditCard className="h-5 w-5" /> Pending Invoices</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {pendingInvoices.map(project => (
                            <Link key={project.id} to={`/projects/${project.slug}?tab=overview`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 shadow-sm hover:shadow-md transition-all">
                                <div>
                                    <p className="font-semibold text-sm">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">Budget: {project.budget ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.budget) : '-'}</p>
                                </div>
                                <Badge className={cn(getPaymentStatusStyles(project.payment_status).tw, 'border-transparent font-normal')}>
                                    {project.payment_status}
                                </Badge>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {bankAccounts.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-muted-foreground" /> Bank Accounts ({bankAccounts.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {bankAccounts.map((account, index) => (
                    <div key={account.id} className="bg-muted/40 p-4 rounded-lg border text-sm space-y-1 w-full relative">
                      <div className="absolute top-2 right-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleCopyBankDetails(account)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="col-span-2 font-medium break-words">{account.bank_name || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="col-span-2 font-medium font-mono break-all">{account.account_number || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="col-span-2 font-medium break-words">{account.account_name || '-'}</span>
                      </div>
                      {(account.swift_code || account.country) && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 mt-2">
                          {account.swift_code && (
                            <>
                              <span className="text-muted-foreground">SWIFT:</span>
                              <span className="col-span-2 font-medium break-words">{account.swift_code}</span>
                            </>
                          )}
                          {account.country && (
                            <>
                              <span className="text-muted-foreground">Location:</span>
                              <span className="col-span-2 font-medium break-words">{account.city ? `${account.city}, ` : ''}{account.country}</span>
                            </>
                          )}
                        </div>
                      )}
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