import { useState, useMemo, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { FolderPlus, Search, LayoutGrid, List, FilePlus, FileText } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbFolder, KbArticle } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import FolderCard from '@/components/kb/FolderCard';
import { Input } from '@/components/ui/input';
import FolderFormDialog from '@/components/kb/FolderFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import FolderListView from '@/components/kb/FolderListView';
import ArticleEditorDialog from '@/components/kb/ArticleEditorDialog';
import { KBCard } from '@/components/kb/KBCard';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ArticleListView from '@/components/kb/ArticleListView';

const KnowledgeBasePage = () => {
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<KbFolder | null>(null);
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<KbFolder | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<KbArticle | null>(null);
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
    if (error) toast.error(`Failed to delete folder: ${error.message}`);
    else {
      toast.success(`Folder "${folderToDelete.name}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
    }
    setFolderToDelete(null);
  };

  const handleAddNewArticle = () => {
    setEditingArticle(null);
    setIsArticleEditorOpen(true);
  };

  const handleEditArticle = (article: KbArticle) => {
    setEditingArticle(article);
    setIsArticleEditorOpen(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    const { error } = await supabase.from('kb_articles').delete().eq('id', articleToDelete.id);
    if (error) toast.error(`Failed to delete article: ${error.message}`);
    else {
      toast.success(`Article "${articleToDelete.title}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
    }
    setArticleToDelete(null);
  };

  const isLoading = isLoadingFolders || isLoadingArticles;
  const cardVariants: ('blue' | 'purple' | 'green')[] = ['blue', 'purple', 'green'];

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
              {sortedFolders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {sortedFolders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} onEdit={handleEditFolder} onDelete={setFolderToDelete} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No folders found.</p>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">All Articles</h2>
              {filteredArticles.length > 0 ? (
                <ArticleListView 
                  articles={filteredArticles} 
                  onEdit={handleEditArticle} 
                  onDelete={setArticleToDelete} 
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No articles found.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'list':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Folders</h2>
            {sortedFolders.length > 0 ? (
              <FolderListView folders={sortedFolders} onEdit={handleEditFolder} onDelete={setFolderToDelete} requestSort={requestSort} />
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No folders found.</p>
              </div>
            )}
          </div>
        );
      case 'articles':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Articles</h2>
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredArticles.map((article, index) => (
                  <KBCard
                    key={article.id}
                    to={`/knowledge-base/articles/${article.slug}`}
                    title={article.title}
                    editedLabel={formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                    variant={cardVariants[index % cardVariants.length]}
                    Icon={FileText}
                    header_image_url={article.header_image_url}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No articles found.</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
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
            <Button onClick={handleAddNewArticle} variant="outline" className="w-full">
              <FilePlus className="mr-2 h-4 w-4" /> New Article
            </Button>
            <Button onClick={handleAddNewFolder} className="w-full">
              <FolderPlus className="mr-2 h-4 w-4" /> New Folder
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'grid' | 'list' | 'articles')}}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Folders (Grid)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Folders (List)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="articles" aria-label="Articles view"><FileText className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Articles View</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ToggleGroup>
        </div>

        {renderContent()}
      </div>

      <FolderFormDialog
        open={isFolderFormOpen}
        onOpenChange={setIsFolderFormOpen}
        folder={editingFolder}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['kb_folders'] })}
      />
      <ArticleEditorDialog
        open={isArticleEditorOpen}
        onOpenChange={setIsArticleEditorOpen}
        article={editingArticle}
        folders={folders}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }}
      />
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the folder "{folderToDelete?.name}" and all articles inside it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteFolder}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the article "{articleToDelete?.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteArticle}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default KnowledgeBasePage;