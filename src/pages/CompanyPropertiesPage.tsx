import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CompanyProperty } from '@/types';
import CompanyPropertyFormDialog from '@/components/settings/CompanyPropertyFormDialog';

const CompanyPropertiesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<CompanyProperty | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<CompanyProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery<CompanyProperty[]>({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*').order('label');
      if (error) throw error;
      return data;
    },
  });

  const handleAddNew = () => {
    setPropertyToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (property: CompanyProperty) => {
    setPropertyToEdit(property);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    const { error } = await supabase.from('company_properties').delete().eq('id', propertyToDelete.id);
    if (error) {
      toast.error(`Failed to delete property.`, { description: error.message });
    } else {
      toast.success(`Property deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['company_properties'] });
    }
    setPropertyToDelete(null);
  };

  const handleSave = async (propertyData: Omit<CompanyProperty, 'id' | 'created_at'>) => {
    setIsSaving(true);
    const { id, ...dataToSave } = propertyToEdit || {};
    const upsertData = { ...dataToSave, ...propertyData };
    
    const { error } = await supabase.from('company_properties').upsert({ id, ...upsertData });

    if (error) {
      toast.error(`Failed to save property.`, { description: error.message });
    } else {
      toast.success(`Property saved successfully.`);
      queryClient.invalidateQueries({ queryKey: ['company_properties'] });
      setIsFormOpen(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Company Properties</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : properties.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">No properties found. Add one to get started.</TableCell></TableRow>
            ) : (
              properties.map(prop => (
                <TableRow key={prop.id}>
                  <TableCell className="font-medium">{prop.label}</TableCell>
                  <TableCell className="text-muted-foreground">{prop.name}</TableCell>
                  <TableCell>{prop.type}</TableCell>
                  <TableCell className="text-right">
                      {!prop.is_default && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(prop)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setPropertyToDelete(prop)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CompanyPropertyFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        property={propertyToEdit}
        isSaving={isSaving}
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
    </div>
  );
};

export default CompanyPropertiesPage;