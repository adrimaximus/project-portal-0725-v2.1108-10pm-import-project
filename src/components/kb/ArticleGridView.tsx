import { KbArticle } from '@/types';
import { KBCard } from './KBCard';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArticleGridViewProps {
  articles: KbArticle[];
}

const ArticleGridView = ({ articles }: ArticleGridViewProps) => {
  const cardVariants: ('blue' | 'purple' | 'green')[] = ['blue', 'purple', 'green'];

  return articles.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {articles.map((article, index) => (
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
  );
};

export default ArticleGridView;