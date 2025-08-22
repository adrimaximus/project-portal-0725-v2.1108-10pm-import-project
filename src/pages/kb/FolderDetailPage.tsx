import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { KbFolder } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Folder, FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArticleEditorDialog from '@/components/kb/ArticleEditorDialog';

type Article = {
  id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
};

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: folder, isLoading: isLoadingFolder } = useQuery({
    queryKey: ['kb_folder', slug],
    queryFn: () => fetchFolderBySlug(slug!),
    enabled: !!slug,
  });

  const { data: allFolders = [] } = useQuery({
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

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ['kb_articles', folder?.id],
    queryFn: async () => {
      if (!folder) return [];
      const { data, error } = await supabase
        .from('kb_articles')
        .select('id, title, slug')
        .eq('folder_id', folder.id)
        .order('title');
      if (error) {
        toast.error("Failed to fetch articles.");
        throw error;
      }
      return data;
    },
    enabled: !!folder,
  });

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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{folder.name}</h1>
            <p className="text-muted-foreground mt-2">{folder.description}</p>
          </div>
          <Button onClick={() => setIsEditorOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </div>

        {isLoadingArticles ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : articles.length > 0 ? (
          <div className="border rounded-lg">
            {articles.map(article => (
              <Link
                key={article.id}
                to={`/knowledge-base/articles/${article.slug}`}
                className="flex items-center gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{article.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">No articles in this folder yet.</p>
            <p className="text-sm">Click "New Article" to add the first one.</p>
          </div>
        )}
      </div>
      <ArticleEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        folders={allFolders}
        folder={folder}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['kb_articles', folder.id] })}
      />
    </PortalLayout>
  );
};

export default FolderDetailPage;