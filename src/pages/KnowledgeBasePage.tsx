import { useState, useMemo, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { FolderPlus, Search, GitMerge, Loader2, LayoutGrid, List, FilePlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbFolder } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import FolderCard from '@/components/kb/FolderCard';
import { Input } from '@/components/ui/input';
import FolderFormDialog from '@/components/kb/FolderFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import FolderListView from '@/components/kb/FolderListView';
import ArticleEditorDialog from '@/components/kb/ArticleEditorDialog';

const KnowledgeBasePage = () => {
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<KbFolder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<KbFolder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedView = localStorage.getItem('kb_view_mode') as 'grid' | 'list';
    return savedView || 'grid';
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof KbFolder | null; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    localStorage.setItem('kb_view_mode', viewMode);
  }, [viewMode]);

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

  const requestSort = (key: keyof KbFolder) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedFolders = useMemo(() => {
    let sortableItems = [...filteredFolders];
    if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredFolders, sortConfig]);

  const handleAddNewFolder = () => {
    setEditingFolder(null);
    setIsFolderFormOpen(true);
  };

  const handleEditFolder = (folder: KbFolder) => {
    setEditingFolder(folder);
    setIsFolderFormOpen(true);
  };

  const handleDeleteFolder = async () => {
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={() => setIsArticleEditorOpen(true)} variant="outline" className="w-full">
              <FilePlus className="mr-2 h-4 w-4" />
              New Article
            </Button>
            <Button onClick={handleAddNewFolder} className="w-full">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'grid' | 'list')}}>
            <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : sortedFolders.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedFolders.map(folder => (
                  <FolderCard key={folder.id} folder={folder} onEdit={handleEditFolder} onDelete={setFolderToDelete} />
                ))}
              </div>
            ) : (
              <FolderListView folders={sortedFolders} onEdit={handleEditFolder} onDelete={setFolderToDelete} requestSort={requestSort} />
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No folders found.</p>
              {searchTerm ? <p>Try a different search term.</p> : <p>Click "New Folder" to get started.</p>}
            </div>
          )}
        </div>
      </div>
      <FolderFormDialog
        open={isFolderFormOpen}
        onOpenChange={setIsFolderFormOpen}
        folder={editingFolder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
          if (editingFolder) {
            queryClient.invalidateQueries({ queryKey: ['kb_folder', editingFolder.slug] });
          }
        }}
      />
      <ArticleEditorDialog
        open={isArticleEditorOpen}
        onOpenChange={setIsArticleEditorOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }}
      />
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
            <AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default KnowledgeBasePage;