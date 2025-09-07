import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import TagFormDialog from '../../components/tags/TagFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const TagsSettingsPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Partial<Tag> | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (error) throw error;
      return data as Tag[];
    },
  });

  const updateTagTypeMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'kanban' | 'general' }) => {
      const { error } = await supabase.from('tags').update({ type }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tag type updated.');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      toast.error('Failed to update tag type.', { description: error.message });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tag deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setTagToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete tag.', { description: error.message });
      setTagToDelete(null);
    },
  });

  const handleAddNew = () => {
    setTagToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setTagToEdit(tag);
    setIsFormOpen(true);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Tags</h1>
            <p className="text-muted-foreground">Organize your contacts with custom tags.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : tags.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No tags found.</TableCell></TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                        <span>{tag.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tag.type}
                        onValueChange={(newType) => updateTagTypeMutation.mutate({ id: tag.id, type: newType as any })}
                        disabled={updateTagTypeMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Label</SelectItem>
                          <SelectItem value="kanban">Kanban Column</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(tag)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTagToDelete(tag)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TagFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tag={tagToEdit}
      />

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag "{tagToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTagMutation.mutate(tagToDelete!.id)} disabled={deleteTagMutation.isPending}>
              {deleteTagMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default TagsSettingsPage;