import { useState, useMemo, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbFolder, KbArticle } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import FolderFormDialog from '@/components/kb/FolderFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageEditorDialog from '@/components/kb/PageEditorDialog';
import KnowledgeBaseHeader from '@/components/kb/KnowledgeBaseHeader';
import FolderGridView from '@/components/kb/FolderGridView';
import FolderListView from '@/components/kb/FolderListView';
import PageGridView from '@/components/kb/PageGridView';
import PageListView from '@/components/kb/PageListView';

type DialogState = 
  | { type: 'edit-folder', data: KbFolder }
  | { type: 'create-folder' }
  | { type: 'delete-folder', data: KbFolder }
  | { type: 'edit-page', data: KbArticle }
  | { type: 'create-page' }
  | { type: 'delete-page', data: KbArticle }
  | null;

const KnowledgeBasePage = () => {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'articles'>(() => {
    const savedView = localStorage.getItem('kb_view_mode') as 'grid' | 'list' | 'articles';
    return savedView || 'grid';
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof KbFolder | null; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    localStorage.setItem('kb_view_mode', viewMode);
  }, [viewMode]);

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kb_folders').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data as KbFolder[];
    }
  });

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ['kb_articles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kb_articles').select('*, kb_folders(name, slug)').order('title');
      if (error) throw error;
      return data as KbArticle[];
    }
  });

  const filteredFolders = useMemo(() => {
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (folder.description && folder.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (folder.category && folder.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [folders, searchTerm]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

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
            if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems;
  }, [filteredFolders, sortConfig]);

  const handleDeleteFolder = async () => {
    if (dialog?.type !== 'delete-folder') return;
    const { error } = await supabase.from('kb_folders').delete().eq('id', dialog.data.id);
    if (error) toast.error(`Failed to delete folder: ${error.message}`);
    else {
      toast.success(`Folder "${dialog.data.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
    }
    setDialog(null);
  };

  const handleDeleteArticle = async () => {
    if (dialog?.type !== 'delete-page') return;
    const { error } = await supabase.from('kb_articles').delete().eq('id', dialog.data.id);
    if (error) toast.error(`Failed to delete page: ${error.message}`);
    else {
      toast.success(`Page "${dialog.data.title}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
    }
    setDialog(null);
  };

  const isLoading = isLoadingFolders || isLoadingArticles;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Folders</h2>
              <FolderGridView 
                folders={sortedFolders} 
                onEdit={(folder) => setDialog({ type: 'edit-folder', data: folder })}
                onDelete={(folder) => setDialog({ type: 'delete-folder', data: folder })}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">All Pages</h2>
              {filteredArticles.length > 0 ? (
                <PageListView 
                  articles={filteredArticles} 
                  onEdit={(article) => setDialog({ type: 'edit-page', data: article })} 
                  onDelete={(article) => setDialog({ type: 'delete-page', data: article })} 
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No pages found.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'list':
        return <FolderListView 
                  folders={sortedFolders} 
                  onEdit={folder => setDialog({ type: 'edit-folder', data: folder })} 
                  onDelete={folder => setDialog({ type: 'delete-folder', data: folder })} 
                  requestSort={requestSort} 
                />;
      case 'articles':
        return <PageGridView articles={filteredArticles} />;
      default:
        return null;
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <KnowledgeBaseHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddNewFolder={() => setDialog({ type: 'create-folder' })}
          onAddNewArticle={() => setDialog({ type: 'create-page' })}
        />
        {renderContent()}
      </div>

      <FolderFormDialog
        open={dialog?.type === 'create-folder' || dialog?.type === 'edit-folder'}
        onOpenChange={() => setDialog(null)}
        folder={dialog?.type === 'edit-folder' ? dialog.data : null}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['kb_folders'] })}
      />
      <PageEditorDialog
        open={dialog?.type === 'create-page' || dialog?.type === 'edit-page'}
        onOpenChange={() => setDialog(null)}
        article={dialog?.type === 'edit-page' ? dialog.data : null}
        folders={folders}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }}
      />
      <AlertDialog open={dialog?.type === 'delete-folder'} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the folder "{dialog?.type === 'delete-folder' && dialog.data.name}" and all pages inside it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={dialog?.type === 'delete-page'} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the page "{dialog?.type === 'delete-page' && dialog.data.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteArticle}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default KnowledgeBasePage;