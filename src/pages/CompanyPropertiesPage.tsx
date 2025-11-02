import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CustomProperty } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CompanyPropertyFormDialog from '@/components/settings/CompanyPropertyFormDialog';

const CompanyPropertiesPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<CustomProperty | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<CustomProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['custom_properties', 'company'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'company').order('label');
      if (error) throw error;
      return data as CustomProperty[];
    }
  });

  const handleAddNew = () => {
    setPropertyToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (property: CustomProperty) => {
    setPropertyToEdit(property);
    setIsFormOpen(true);
  };

  const handleSave = async (propertyData: Omit<CustomProperty, 'id' | 'category'> & { name: string }) => {
    setIsSaving(true);
    const { id, is_default, ...dataToSave } = propertyToEdit || {};
    const upsertData = { ...dataToSave, ...propertyData, is_default: false, category: 'company' };

    const promise = propertyToEdit?.id
      ? supabase.from('custom_properties').update(upsertData).eq('id', propertyToEdit.id)
      : supabase.from('custom_properties').insert(upsertData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save property: ${error.message}`);
    } else {
      toast.success(`Property "${propertyData.label}" saved.`);
      queryClient.invalidateQueries({ queryKey: ['custom_properties', 'company'] });
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    const { error } = await supabase.from('custom_properties').delete().eq('id', propertyToDelete.id);
    if (error) {
      toast.error(`Failed to delete property: ${error.message}`);
    } else {
      toast.success(`Property "${propertyToDelete.label}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['custom_properties', 'company'] });
    }
    setPropertyToDelete(null);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings/properties">Properties</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Company Properties</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company Properties</h1>
            <p className="text-muted-foreground">Modify and create company properties.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Property
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Properties</CardTitle>
            <CardDescription>These are the fields available for your companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading properties...</TableCell></TableRow>
                ) : properties.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">No custom properties found.</TableCell></TableRow>
                ) : properties.map(prop => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.label}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{prop.type}</Badge></TableCell>
                    <TableCell className="text-right">
                      {!(prop as any).is_default && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(prop)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setPropertyToDelete(prop)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CompanyPropertyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        property={propertyToEdit}
        isSaving={isSaving}
        properties={properties}
      />

      <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{propertyToDelete?.label}" property. This action cannot be undone.
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

export default CompanyPropertiesPage;