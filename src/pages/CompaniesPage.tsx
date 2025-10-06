import { useState, useMemo } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, Building, Search, Settings } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Company, CompanyProperty } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CompanyFormDialog from '@/components/companies/CompanyFormDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    }
  });
};

const CompaniesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CompanyProperty[]>({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*').order('label');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingCompanies || isLoadingProperties;

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const lowercasedFilter = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(lowercasedFilter) ||
      (company.legal_name && company.legal_name.toLowerCase().includes(lowercasedFilter)) ||
      (company.address && company.address.toLowerCase().includes(lowercasedFilter))
    );
  }, [companies, searchTerm]);

  const handleAddNew = () => {
    setCompanyToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;

    const { error } = await supabase.from('companies').delete().eq('id', companyToDelete.id);

    if (error) {
      toast.error(`Failed to delete ${companyToDelete.name}.`, { description: error.message });
    } else {
      toast.success(`${companyToDelete.name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
    setCompanyToDelete(null);
  };

  const findImageUrlInCustomProps = (props: Record<string, any> | null | undefined): string | null => {
    if (!props) return null;
    for (const key in props) {
      const value = props[key];
      if (typeof value === 'string' && value.includes('supabase.co') && value.includes('image_company')) {
        return value;
      }
    }
    return null;
  };

  const renderCustomPropertyValue = (value: any, type: string) => {
    if (value === null || typeof value === 'undefined' || value === '') return '-';
    if (type === 'image' && typeof value === 'string' && value.startsWith('http')) {
      return <img src={value} alt="Company property" className="h-10 w-10 object-contain rounded-md bg-muted p-1" />;
    }
    if (type === 'date' && typeof value === 'string') {
      try {
        return formatDistanceToNow(new Date(value), { addSuffix: true });
      } catch (e) {
        return value;
      }
    }
    return String(value);
  };

  const visibleProperties = properties.filter(prop => prop.type !== 'image');
  const totalColumns = 5 + visibleProperties.length;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/people">People</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Companies</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">Manage company profiles and information.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/settings/company-properties')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Company Directory</CardTitle>
                <CardDescription>A list of all companies in your database.</CardDescription>
              </div>
              <div className="relative w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search companies..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Legal Name</TableHead>
                  <TableHead>Address</TableHead>
                  {visibleProperties.map(prop => (
                    <TableHead key={prop.id}>{prop.label}</TableHead>
                  ))}
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={totalColumns} className="text-center">Loading companies...</TableCell></TableRow>
                ) : companies.length === 0 ? (
                  <TableRow><TableCell colSpan={totalColumns} className="text-center h-24">No companies found. Add one to get started.</TableCell></TableRow>
                ) : (
                  filteredCompanies.map(company => {
                    const customLogoUrl = findImageUrlInCustomProps(company.custom_properties);
                    const logoUrl = company.logo_url || customLogoUrl;
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {logoUrl ? (
                              <img src={logoUrl} alt={company.name} className="h-10 w-10 object-contain rounded-md bg-muted p-1" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                <Building className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            {company.name}
                          </div>
                        </TableCell>
                        <TableCell>{company.legal_name || '-'}</TableCell>
                        <TableCell>
                          {(() => {
                            if (!company.address) return '-';
                            let displayAddress = company.address;
                            let mapsQuery = company.address;
                            try {
                                const parsed = JSON.parse(company.address);
                                if (parsed.name && parsed.address) {
                                    displayAddress = `${parsed.name} - ${parsed.address}`;
                                    mapsQuery = `${parsed.name}, ${parsed.address}`;
                                }
                            } catch (e) {}
                            return (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    {displayAddress}
                                </a>
                            );
                          })()}
                        </TableCell>
                        {visibleProperties.map(prop => (
                          <TableCell key={prop.id}>
                            {renderCustomPropertyValue(company.custom_properties?.[prop.name], prop.type)}
                          </TableCell>
                        ))}
                        <TableCell>{formatDistanceToNow(new Date(company.updated_at), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(company)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setCompanyToDelete(company)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <CompanyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={companyToEdit}
      />

      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {companyToDelete?.name}. This action cannot be undone.
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

export default CompaniesPage;