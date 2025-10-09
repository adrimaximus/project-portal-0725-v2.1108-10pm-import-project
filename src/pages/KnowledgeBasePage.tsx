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
import AllArticlesView from '@/components/kb/AllArticlesView';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

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
  const { user } = useAuth();
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  const { data: folders = [], isLoading: isLoadingFolders, error: foldersError } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_kb_folders');
      if (error) throw error;
      return data as KbFolder[];
    }
  });

  const { data: articles = [], isLoading: isLoadingArticles, error: articlesError } = useQuery({
    queryKey: ['kb_articles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_kb_articles');
      if (error) throw error;
      return data as KbArticle[];
    }
  });

  useEffect(() => {
    if (foldersError) {
        toast.error("Failed to load knowledge base folders.", { description: foldersError.message });
    }
    if (articlesError) {
        toast.error("Failed to load knowledge base articles.", { description: articlesError.message });
    }
  }, [foldersError, articlesError]);

  useEffect(() => {
    if (!user) return;

    const kbChannel = supabase
      .channel('realtime-kb-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kb_folders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kb_articles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kb_folder_collaborators' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kbChannel);
    };
  }, [user, queryClient]);

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

  return (
    <PortalLayout>
      <div className="space-y-6">
        <KnowledgeBaseHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onAddNewFolder={() => setDialog({ type: 'create-folder' })}
          onAddNewArticle={() => setDialog({ type: 'create-page' })}
        />
        
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-10 w-48 mt-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          </div>
        ) : (
          <>
            <Collapsible open={isFoldersOpen} onOpenChange={setIsFoldersOpen} className="border-t pt-6">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-0 text-lg font-semibold mb-4 hover:bg-transparent">
                  Folders
                  <ChevronDown className={`h-5 w-5 transition-transform ${isFoldersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FolderGridView 
                  folders={filteredFolders} 
                  onEdit={(folder) => setDialog({ type: 'edit-folder', data: folder })}
                  onDelete={(folder) => setDialog({ type: 'delete-folder', data: folder })}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold mb-4">All Pages</h2>
              <AllArticlesView
                articles={filteredArticles}
                onEdit={(article) => setDialog({ type: 'edit-page', data: article })}
                onDelete={(article) => setDialog({ type: 'delete-page', data: article })}
              />
            </div>
          </>
        )}
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