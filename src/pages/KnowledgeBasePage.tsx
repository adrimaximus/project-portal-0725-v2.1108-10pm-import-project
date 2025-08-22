import { useState, useMemo } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { FolderPlus, Search, GitMerge, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbFolder } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import CreateFolderDialog from '@/components/kb/CreateFolderDialog';
import FolderCard from '@/components/kb/FolderCard';
import { Input } from '@/components/ui/input';
import EditFolderDialog from '@/components/kb/EditFolderDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const KnowledgeBasePage = () => {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<KbFolder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<KbFolder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kb_folders').select('*').order('name', { ascending: true });
      if (error) {
        toast.error("Failed to fetch folders.");
        throw error;
      }
      return data as KbFolder[];
    }
  });

  const filteredFolders = useMemo(() => {
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (folder.description && folder.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (folder.category && folder.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [folders, searchTerm]);

  const handleEdit = (folder: KbFolder) => {
    setFolderToEdit(folder);
    setIsEditFolderOpen(true);
  };

  const handleDelete = async () => {
    if (!folderToDelete) return;
    const { error } = await supabase.from('kb_folders').delete().eq('id', folderToDelete.id);
    if (error) {
      toast.error(`Failed to delete folder: ${error.message}`);
    } else {
      toast.success(`Folder "${folderToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
    }
    setFolderToDelete(null);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Find and manage your team's articles and documentation.</p>
          </div>
          <Button onClick={() => setIsCreateFolderOpen(true)} className="w-full sm:w-auto">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filteredFolders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFolders.map(folder => (
                <FolderCard key={folder.id} folder={folder} onEdit={handleEdit} onDelete={setFolderToDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No folders found.</p>
              {searchTerm ? <p>Try a different search term.</p> : <p>Click "New Folder" to get started.</p>}
            </div>
          )}
        </div>
      </div>
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['kb_folders'] })}
      />
      {folderToEdit && (
        <EditFolderDialog
          open={isEditFolderOpen}
          onOpenChange={setIsEditFolderOpen}
          folder={folderToEdit}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
            queryClient.invalidateQueries({ queryKey: ['kb_folder', folderToEdit.slug] });
          }}
        />
      )}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder "{folderToDelete?.name}" and all articles inside it. This action cannot be undone.
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

export default KnowledgeBasePage;