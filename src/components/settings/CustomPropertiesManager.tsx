import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import PropertyFormDialog, { PropertyFormValues } from './PropertyFormDialog';
import { toast } from 'sonner';
import { CustomProperty } from '@/types';

interface CustomPropertiesManagerProps {
  category: 'contact' | 'company' | 'project' | 'billing';
  title: string;
  description: string;
}

const CustomPropertiesManager = ({ category, title, description }: CustomPropertiesManagerProps) => {
  const [properties, setProperties] = useState<CustomProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<CustomProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_properties')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to fetch properties.');
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [category]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }
    const { error } = await supabase.from('custom_properties').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete property.');
      console.error('Error deleting property:', error);
    } else {
      toast.success('Property deleted successfully.');
      fetchProperties();
    }
  };

  const handleOpenDialog = (property: CustomProperty | null = null) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  const handleSave = async (propertyData: Omit<PropertyFormValues, 'options'> & { options?: string[] | null }) => {
    setIsSaving(true);
    const name = propertyData.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { id, is_default, ...dataToSave } = editingProperty || {};
    const upsertData = { ...dataToSave, ...propertyData, name, is_default: false, category };

    const promise = editingProperty?.id
      ? supabase.from('custom_properties').update(upsertData).eq('id', editingProperty.id)
      : supabase.from('custom_properties').insert(upsertData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save property: ${error.message}`);
    } else {
      toast.success(`Property "${propertyData.label}" saved.`);
      fetchProperties();
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Property
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No custom properties created yet.</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>Create your first property</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.label}</TableCell>
                    <TableCell>{prop.type}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(prop)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(prop.id)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PropertyFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        property={editingProperty}
        onSave={handleSave}
        isSaving={isSaving}
        properties={properties}
      />
    </>
  );
};

export default CustomPropertiesManager;