import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const fetchArticle = async (slug: string) => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select(`
      *,
      profiles ( first_name, last_name, avatar_url ),
      kb_article_tags ( tags ( id, name, color ) ),
      projects ( id, name, slug )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error("Error fetching article:", error);
    throw new Error(error.message);
  }
  return data;
};

const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'master admin';

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!isLoading && !article) {
      toast.error("Article not found.");
      navigate('/knowledge-base');
    }
  }, [isLoading, article, navigate]);

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-3/4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!article) return null;

  return (
    <PortalLayout>
      <main className="max-w-4xl mx-auto py-8 px-4">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/knowledge-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Knowledge Base
          </Link>
        </Button>

        <article>
          {article.cover_image_url && (
            <img src={article.cover_image_url} alt={article.title} className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {article.kb_article_tags.map((tag: any) => (
              <Badge key={tag.tags.id} variant="secondary" style={{ backgroundColor: `${tag.tags.color}20`, borderColor: tag.tags.color, color: tag.tags.color }}>
                {tag.tags.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{article.title}</h1>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={article.profiles?.avatar_url} />
                <AvatarFallback>{article.profiles?.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{article.profiles?.first_name} {article.profiles?.last_name}</p>
                <p className="text-sm text-muted-foreground">
                  Published on {format(new Date(article.created_at), 'PPP', { locale: id })}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button asChild variant="outline">
                <Link to={`/knowledge-base/${article.slug}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Article
                </Link>
              </Button>
            )}
          </div>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </article>
      </main>
    </PortalLayout>
  );
};

export default ArticleDetailPage;