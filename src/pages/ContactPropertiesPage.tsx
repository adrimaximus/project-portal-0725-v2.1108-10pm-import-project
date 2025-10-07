import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContactProperty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PropertyFormDialog from '@/components/settings/PropertyFormDialog';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import ConfirmationDialog from '@/components/settings/ConfirmationDialog';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';

const ContactPropertiesPage = () => {
  const [properties, setProperties] = useState<ContactProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<ContactProperty | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<ContactProperty | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_properties')
        .select('*')
        .order('label', { ascending: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch properties: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleAddNew = () => {
    setPropertyToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (property: ContactProperty) => {
    setPropertyToEdit(property);
    setIsFormOpen(true);
  };

  const handleDelete = (property: ContactProperty) => {
    setPropertyToDelete(property);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await supabase
        .from('contact_properties')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      toast.success(`Property "${propertyToDelete.label}" deleted successfully.`);
      setProperties(properties.filter(p => p.id !== propertyToDelete.id));
    } catch (error: any) {
      toast.error(`Error deleting property: ${error.message}`);
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleSave = async (propertyData: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url' | 'options'> & { options?: string[] | null }) => {
    setIsSaving(true);
    try {
      const propertyToSave = {
        ...propertyData,
        options: propertyData.options
          ? propertyData.options.map(opt => ({
              value: opt.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
              label: opt
            }))
          : null,
      };

      const { data, error } = await supabase
        .from('contact_properties')
        .upsert({
          ...(propertyToEdit ? { id: propertyToEdit.id } : {}),
          ...propertyToSave,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Property ${propertyToEdit ? 'updated' : 'created'} successfully.`);
      setIsFormOpen(false);
      setPropertyToEdit(null);
      fetchProperties();
    } catch (error: any) {
      toast.error(`Error saving property: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(properties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setProperties(items);
    toast.info("Drag-and-drop reordering is a visual placeholder. Order is not saved yet.");
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/people">People</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contact Properties</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contact Properties</CardTitle>
                <CardDescription>Manage the fields used for your contacts.</CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Property
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="properties">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {properties.map((prop, index) => (
                        <Draggable key={prop.id} draggableId={prop.id} index={index} isDragDisabled={prop.is_default}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center p-3 rounded-md border transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg bg-muted' : 'bg-card'
                              }`}
                            >
                              <div {...provided.dragHandleProps} className={`mr-3 ${prop.is_default ? 'cursor-not-allowed text-muted-foreground' : 'cursor-grab'}`}>
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="flex-grow">
                                <span className="font-medium">{prop.label}</span>
                                <Badge variant="outline" className="ml-2">{prop.type}</Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                {prop.is_default ? (
                                  <Badge variant="secondary">Default</Badge>
                                ) : (
                                  <>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(prop)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prop)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      <PropertyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        property={propertyToEdit}
        isSaving={isSaving}
        properties={properties}
      />

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Property"
        description={`Are you sure you want to delete the property "${propertyToDelete?.label}"? This action cannot be undone.`}
      />
    </PortalLayout>
  );
};

export default ContactPropertiesPage;