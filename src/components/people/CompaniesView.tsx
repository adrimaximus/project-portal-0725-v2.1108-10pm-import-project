import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Building, Loader2, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import CompanyFormDialog from './CompanyFormDialog';
import { Company, CompanyProperty } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CompaniesView = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
        queryKey: ['companies'],
        queryFn: async () => {
            const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CompanyProperty[]>({
        queryKey: ['company_properties'],
        queryFn: async () => {
            const { data, error } = await supabase.from('company_properties').select('*').order('label');
            if (error) throw error;
            return data;
        },
    });

    const isLoading = isLoadingCompanies || isLoadingProperties;

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.legal_name && company.legal_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.address && company.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
    const totalColumns = 4 + visibleProperties.length;

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col space-y-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies by name, legal name, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleAddNew} size="icon">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add Company</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <div className="border rounded-lg overflow-auto flex-grow">
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] md:sticky left-0 bg-card">Company</TableHead>
                                <TableHead className="min-w-[200px]">Legal Name</TableHead>
                                <TableHead className="min-w-[300px]">Address</TableHead>
                                {visibleProperties.map(prop => (
                                    <TableHead key={prop.id} className="min-w-[200px]">{prop.label}</TableHead>
                                ))}
                                <TableHead className="min-w-[150px]">Updated At</TableHead>
                                <TableHead className="text-right md:sticky right-0 bg-card">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={totalColumns} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
                            ) : filteredCompanies.length === 0 ? (
                                <TableRow><TableCell colSpan={totalColumns} className="text-center h-24">{searchTerm ? 'No companies match your search.' : 'No companies found. Add one to get started.'}</TableCell></TableRow>
                            ) : (
                                filteredCompanies.map(company => {
                                    const customLogoUrl = findImageUrlInCustomProps(company.custom_properties);
                                    const logoUrl = company.logo_url || customLogoUrl;
                                    return (
                                        <TableRow key={company.id}>
                                            <TableCell className="md:sticky left-0 bg-card">
                                                <div className="flex items-center gap-3">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt={company.name} className="h-10 w-10 object-contain rounded-md bg-muted p-1" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                            <Building className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{company.name}</span>
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
                                            <TableCell>{company.updated_at ? formatDistanceToNow(new Date(company.updated_at), { addSuffix: true }) : ''}</TableCell>
                                            <TableCell className="text-right md:sticky right-0 bg-card">
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
        </TooltipProvider>
    );
};

export default CompaniesView;