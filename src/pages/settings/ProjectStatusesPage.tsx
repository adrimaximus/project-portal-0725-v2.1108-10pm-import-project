import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StatusFormDialog, { StatusFormValues } from '@/components/settings/StatusFormDialog';

interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

const ProjectStatusesPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<ProjectStatus | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<ProjectStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['project_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_statuses')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as ProjectStatus[];
    }
  });

  const handleAddNew = () => {
    setStatusToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (status: ProjectStatus) => {
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
        // Calculate next position
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
              Manage the different statuses for your projects.
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
              Define the workflow stages for your projects. Renaming a status will update all associated projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading statuses...</TableCell></TableRow>
                ) : statuses.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">No statuses found.</TableCell></TableRow>
                ) : (
                  statuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
                          <Badge variant="outline" className="font-mono">
                            {status.color}
                          </Badge>
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
                            <DropdownMenuItem onSelect={() => handleEdit(status)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={() => setStatusToDelete(status)} 
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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