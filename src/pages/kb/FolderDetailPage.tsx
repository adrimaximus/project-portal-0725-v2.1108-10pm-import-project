import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { KbFolder, KbArticle } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Folder, FileText, PlusCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageEditorDialog from '@/components/kb/PageEditorDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FolderGridView from '@/components/kb/FolderGridView';
import PageGridView from '@/components/kb/PageGridView';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

type DialogState = 
  | { type: 'edit-page', data: KbArticle }
  | { type: 'create-page' }
  | { type: 'delete-page', data: KbArticle }
  | null;

const fetchFolderBySlug = async (slug: string): Promise<KbFolder | null> => {
  const { data, error } = await supabase
    .from('kb_folders')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    toast.error("Failed to fetch folder details.");
    console.error(error);
    return null;
  }
  return data;
};

const FolderDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  const { data: folder, isLoading: isLoadingFolder } = useQuery({
    queryKey: ['kb_folder', slug],
    queryFn: () => fetchFolderBySlug(slug!),
    enabled: !!slug,
  });

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ['kb_articles', folder?.id],
    queryFn: async () => {
      if (!folder) return [];
      const { data, error } = await supabase.rpc('get_user_kb_articles');
      if (error) {
        toast.error("Failed to fetch pages.");
        throw error;
      }
      return (data as KbArticle[]).filter(article => article.folder_id === folder.id);
    },
    enabled: !!folder,
  });

  const { data: allFolders = [] } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_kb_folders');
      if (error) {
        toast.error("Failed to fetch folders list.");
        return [];
      }
      return data as KbFolder[];
    }
  });

  const handleEditArticle = (article: KbArticle) => {
    setDialog({ type: 'edit-page', data: article });
  };

  const handleDeleteArticle = async () => {
    if (dialog?.type !== 'delete-page') return;
    const { error } = await supabase.from('kb_articles').delete().eq('id', dialog.data.id);
    if (error) {
      toast.error(`Failed to delete page: ${error.message}`);
    } else {
      toast.success(`Page "${dialog.data.title}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_articles', folder?.id] });
    }
    setDialog(null);
  };

  if (isLoadingFolder) {
    return (
      <PortalLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!folder) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Folder Not Found</h2>
          <p className="text-muted-foreground">The folder you are looking for does not exist.</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/knowledge-base">Knowledge Base</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {folder.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{folder.name}</h1>
              {folder.category && <Badge variant="secondary">{folder.category}</Badge>}
            </div>
            <p className="text-muted-foreground mt-2">{folder.description}</p>
          </div>
          <Button onClick={() => setDialog({ type: 'create-page' })} className="w-full sm:w-auto flex-shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>

        <Collapsible open={isFoldersOpen} onOpenChange={setIsFoldersOpen} className="border-t pt-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-0 text-lg font-semibold mb-4 hover:bg-transparent">
              All Folders
              <ChevronDown className={`h-5 w-5 transition-transform ${isFoldersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <FolderGridView folders={allFolders.filter(f => f.id !== folder.id)} />
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">Pages in this Folder</h2>
          {isLoadingArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : articles.length > 0 ? (
            <PageGridView
              articles={articles}
              onEdit={handleEditArticle}
              onDelete={(article) => setDialog({ type: 'delete-page', data: article })}
            />
          ) : (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">No knowledge base in this folder.</p>
              <p className="text-sm">Click "New Page" to add the first one.</p>
            </div>
          )}
        </div>
      </div>
      <PageEditorDialog
        open={dialog?.type === 'create-page' || dialog?.type === 'edit-page'}
        onOpenChange={() => setDialog(null)}
        article={dialog?.type === 'edit-page' ? dialog.data : null}
        folder={dialog?.type === 'create-page' ? folder : undefined}
        folders={allFolders}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kb_articles', folder.id] });
          if (dialog?.type === 'edit-page') {
            queryClient.invalidateQueries({ queryKey: ['kb_article', dialog.data.slug] });
          }
        }}
      />
      <AlertDialog open={dialog?.type === 'delete-page'} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the page "{dialog?.type === 'delete-page' && dialog.data.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default FolderDetailPage;