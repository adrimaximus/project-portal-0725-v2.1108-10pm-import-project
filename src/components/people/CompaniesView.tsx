import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Building, Loader2, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import CompanyFormDialog, { Company } from './CompanyFormDialog';
import { useNavigate } from 'react-router-dom';

const CompaniesView = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: companies = [], isLoading } = useQuery<Company[]>({
        queryKey: ['companies'],
        queryFn: async () => {
            const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

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

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Companies</h2>
                    <p className="text-muted-foreground">Manage all companies in your network.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/settings/company-properties')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Company Properties
                    </Button>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Company
                    </Button>
                </div>
            </div>
            <div className="border rounded-lg overflow-auto flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead className="hidden sm:table-cell">Legal Name</TableHead>
                            <TableHead className="hidden md:table-cell">Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
                        ) : companies.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">No companies found. Add one to get started.</TableCell></TableRow>
                        ) : (
                            companies.map(company => (
                                <TableRow key={company.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt={company.name} className="h-10 w-10 object-contain rounded-md bg-muted p-1" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                    <Building className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <span className="font-medium">{company.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{company.legal_name || '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{company.address || '-'}</TableCell>
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
                            ))
                        )}
                    </TableBody>
                </Table>
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
        </div>
    );
};

export default CompaniesView;