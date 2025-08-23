import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { KbFolder, KbArticle as Article } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Folder, FileText, Edit, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ArticleEditorDialog from '@/components/kb/ArticleEditorDialog';
import { useAuth } from '@/contexts/AuthContext';
import TiptapEditor from '@/components/kb/TiptapEditor';

const fetchArticleBySlug = async (slug: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select(`
      *,
      kb_folders (
        name,
        slug
      )
    `)
    .eq('slug', slug)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    toast.error("Failed to fetch article details.");
    console.error(error);
    return null;
  }
  return data as Article;
};

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  const { data: article, isLoading } = useQuery({
    queryKey: ['kb_article', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
  });

  const { data: allFolders = [] } = useQuery({
    queryKey: ['kb_folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kb_folders').select('*').order('name');
      if (error) {
        toast.error("Failed to fetch folders list.");
        return [];
      }
      return data as KbFolder[];
    }
  });

  useEffect(() => {
    if (article) {
      setContent(article.content?.html || article.content || "");
    }
  }, [article]);

  const handleSave = async () => {
    if (!article) return;
    const { error } = await supabase
      .from('kb_articles')
      .update({ content: { html: content }, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (error) {
      toast.error("Failed to save article.", { description: error.message });
    } else {
      toast.success("Article saved successfully.");
      queryClient.invalidateQueries({ queryKey: ['kb_article', slug] });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (article) {
      setContent(article.content?.html || article.content || "");
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!article) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Article Not Found</h2>
          <p className="text-muted-foreground">The article you are looking for does not exist.</p>
        </div>
      </PortalLayout>
    );
  }

  const canEdit = user && (user.id === article.user_id || user.role === 'admin' || user.role === 'master admin');

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/knowledge-base">Knowledge Base</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/knowledge-base/folders/${article.kb_folders.slug}`}>
                  <Folder className="h-4 w-4 mr-2" />
                  {article.kb_folders.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {article.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {article.header_image_url && (
          <img
            src={article.header_image_url}
            alt={article.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}

        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                  <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your article..."
          editable={isEditing}
        />
      </div>
    </PortalLayout>
  );
};

export default ArticlePage;