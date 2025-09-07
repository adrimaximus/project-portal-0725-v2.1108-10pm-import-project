import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2, Search } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import TagFormDialog from '@/components/settings/TagFormDialog';
import { Input } from '@/components/ui/input';

const TagsSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name');
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNew = () => {
    setTagToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setTagToEdit(tag);
    setIsFormOpen(true);
  };

  const handleSave = async (tagData: Omit<Tag, 'id' | 'user_id'>) => {
    if (!user) return;
    setIsSaving(true);
    const upsertData = { ...tagData, user_id: user.id, id: tagToEdit?.id };

    const { error } = await supabase.from('tags').upsert(upsertData);
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save tag: ${error.message}`);
    } else {
      toast.success(`Tag "${tagData.name}" saved.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    const { error } = await supabase.from('tags').delete().eq('id', tagToDelete.id);
    if (error) {
      toast.error(`Failed to delete tag: ${error.message}`);
    } else {
      toast.success(`Tag "${tagToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['tags', user.id] });
    }
    setTagToDelete(null);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Tags</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Tags</h1>
            <p className="text-muted-foreground">Create and manage your personal tags.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Tag
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Your Tags</CardTitle>
                <CardDescription>These tags are available for you to use across the application.</CardDescription>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
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
                  <TableRow><TableCell colSpan={3} className="text-center">Loading tags...</TableCell></TableRow>
                ) : filteredTags.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">
                    {searchQuery ? `No tags found for "${searchQuery}"` : "No tags created yet."}
                  </TableCell></TableRow>
                ) : filteredTags.map(tag => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="font-mono text-sm">{tag.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(tag)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setTagToDelete(tag)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TagFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        tag={tagToEdit}
        isSaving={isSaving}
      />

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{tagToDelete?.name}" tag. This action cannot be undone.
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

export default TagsSettingsPage;