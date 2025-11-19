import { useState, useEffect } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, GripVertical } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusFormDialog, { StatusFormValues } from '@/components/settings/StatusFormDialog';
import { useProjectStatuses, ProjectStatusDef } from '@/hooks/useProjectStatuses';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { getStatusBadgeStyle } from "@/lib/colors";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

// Sortable Row Component
const SortableTableRow = ({ status, onEdit, onDelete }: { status: ProjectStatusDef, onEdit: (s: ProjectStatusDef) => void, onDelete: (s: ProjectStatusDef) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });
  const theme = useResolvedTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as 'relative',
  };

  const badgeStyle = getStatusBadgeStyle(status.color, theme);

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell className="w-[50px]">
        <Button variant="ghost" size="icon" className="cursor-grab touch-none" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {/* Preview as it appears in the app */}
          <Badge 
            className="border-0 font-medium px-2.5 py-0.5"
            style={badgeStyle}
          >
            {status.name}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: status.color }} />
          <span className="font-mono text-xs text-muted-foreground">
            {status.color}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(status)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={() => onDelete(status)} 
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const ProjectStatusesPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<ProjectStatusDef | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<ProjectStatusDef | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<ProjectStatusDef[]>([]);

  const { data: statuses = [], isLoading, updatePositions } = useProjectStatuses();

  useEffect(() => {
    setLocalStatuses(statuses);
  }, [statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalStatuses((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Prepare updates for backend
        const updates = newItems.map((item, index) => ({
          id: item.id,
          position: index
        }));
        
        // Trigger mutation
        updatePositions(updates);
        
        return newItems;
      });
    }
  };

  const handleAddNew = () => {
    setStatusToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (status: ProjectStatusDef) => {
    setStatusToEdit(status);
    setIsFormOpen(true);
  };

  const handleSave = async (data: StatusFormValues) => {
    setIsSaving(true);
    try {
      if (statusToEdit) {
        // Update existing status via RPC to sync with projects table
        const { error } = await supabase.rpc('update_project_status_definition', {
          p_id: statusToEdit.id,
          p_name: data.name,
          p_color: data.color
        });
        
        if (error) throw error;
        toast.success(`Status "${data.name}" updated successfully.`);
      } else {
        // Create new status
        const maxPosition = statuses.length > 0 
          ? Math.max(...statuses.map(s => s.position || 0)) 
          : -1;
          
        const { error } = await supabase
          .from('project_statuses')
          .insert({
            name: data.name,
            color: data.color,
            position: maxPosition + 1
          });
          
        if (error) throw error;
        toast.success(`Status "${data.name}" created successfully.`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['project_statuses'] });
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error saving status:', error);
      toast.error(`Failed to save status: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!statusToDelete) return;
    try {
      const { error } = await supabase
        .from('project_statuses')
        .delete()
        .eq('id', statusToDelete.id);
        
      if (error) throw error;
      
      toast.success(`Status "${statusToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['project_statuses'] });
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast.error(`Failed to delete status: ${error.message}`);
    } finally {
      setStatusToDelete(null);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project Statuses</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Statuses</h1>
            <p className="text-muted-foreground">
              Manage and reorder your project statuses. The order here will be reflected everywhere.
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Status
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statuses</CardTitle>
            <CardDescription>
              Drag and drop to reorder statuses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Color Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Loading statuses...</TableCell></TableRow>
                    ) : localStatuses.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center h-24">No statuses found.</TableCell></TableRow>
                    ) : (
                      <SortableContext 
                        items={localStatuses.map(s => s.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        {localStatuses.map((status) => (
                          <SortableTableRow 
                            key={status.id} 
                            status={status} 
                            onEdit={handleEdit} 
                            onDelete={setStatusToDelete} 
                          />
                        ))}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </CardContent>
        </Card>
      </div>

      <StatusFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        initialData={statusToEdit}
        isSaving={isSaving}
      />

      <AlertDialog open={!!statusToDelete} onOpenChange={(open) => !open && setStatusToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the status "{statusToDelete?.name}". Projects currently using this status will keep the text value but won't be linked to a managed status definition anymore.
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

export default ProjectStatusesPage;