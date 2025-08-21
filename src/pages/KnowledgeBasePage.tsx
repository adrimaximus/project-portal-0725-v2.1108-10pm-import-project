import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const ArticleCard = ({ article }: { article: any }) => (
  <Link to={`/knowledge-base/${article.slug}`}>
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      {article.cover_image_url && (
        <img src={article.cover_image_url} alt={article.title} className="w-full h-28 object-cover rounded-t-lg" />
      )}
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <div className="flex flex-wrap gap-1">
          {article.kb_article_tags.map((tag: any) => (
            <Badge key={tag.tags.id} variant="secondary" style={{ backgroundColor: `${tag.tags.color}20`, borderColor: tag.tags.color, color: tag.tags.color }}>
              {tag.tags.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3 text-sm text-muted-foreground p-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={article.profiles?.avatar_url} />
          <AvatarFallback>{article.profiles?.first_name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-xs">{article.profiles?.first_name} {article.profiles?.last_name}</p>
          <p className="text-xs">{formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: id })}</p>
        </div>
      </CardFooter>
    </Card>
  </Link>
);

const KnowledgeBasePage = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'master admin';

  useEffect(() => {
    const fetchArticles = async () => {
      if (!isLoading) {
        setIsSearching(true);
      }
      
      let query = supabase
        .from('kb_articles')
        .select(`
          *,
          profiles ( first_name, last_name, avatar_url ),
          kb_article_tags ( tags ( id, name, color ) )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to fetch articles.");
      } else {
        setArticles(data);
      }
      setIsLoading(false);
      setIsSearching(false);
    };

    const timeoutId = setTimeout(fetchArticles, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isLoading]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Find guides, tutorials, and important information.</p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link to="/knowledge-base/new">
                <PlusCircle className="mr-2 h-4 w-4" /> New Article
              </Link>
            </Button>
          )}
        </div>
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map(article => <ArticleCard key={article.id} article={article} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold">No Articles Found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or create a new article.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default KnowledgeBasePage;