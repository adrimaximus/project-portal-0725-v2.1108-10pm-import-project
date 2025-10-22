import { useState, useMemo } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, Building, Search } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Company } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CompanyFormDialog from '@/components/people/CompanyFormDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name');
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

  const { data: companies = [], isLoading } = useCompanies();

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
      toast.error(`Failed to delete company: ${error.message}`);
    } else {
      toast.success(`Company "${companyToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
    setCompanyToDelete(null);
  };

  const findImageUrlInCustomProps = (props: Record<string, any> | null | undefined): string | null => {
    if (!props) return null;
    for (const key in props) {
        const value = props[key];
        if (typeof value === 'string' && value.includes('supabase.co') && value.includes('company-logos')) {
            return value;
        }
    }
    return null;
  };

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
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Company
          </Button>
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
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading companies...</TableCell></TableRow>
                ) : filteredCompanies.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No companies found.</TableCell></TableRow>
                ) : filteredCompanies.map(company => {
                  const customLogoUrl = findImageUrlInCustomProps(company.custom_properties);
                  const logoUrl = company.logo_url || customLogoUrl;
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-md">
                            <AvatarImage src={logoUrl || undefined} className="object-contain" />
                            <AvatarFallback className="rounded-md"><Building className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          {company.name}
                        </div>
                      </TableCell>
                      <TableCell>{company.legal_name || '-'}</TableCell>
                      <TableCell>{company.address || '-'}</TableCell>
                      <TableCell>{company.updated_at ? formatDistanceToNow(new Date(company.updated_at), { addSuffix: true }) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(company)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setCompanyToDelete(company)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              This will permanently delete the company "{companyToDelete?.name}". This action cannot be undone.
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