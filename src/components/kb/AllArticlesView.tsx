import { useState, useMemo } from 'react';
import { KbArticle } from '@/types';
import { KBCard } from './KBCard';
import { Button } from '../ui/button';

interface AllArticlesViewProps {
  articles: KbArticle[];
  onEdit: (article: KbArticle) => void;
  onDelete: (article: KbArticle) => void;
}

const ARTICLES_PREVIEW_LIMIT = 12;

const AllArticlesView = ({ articles, onEdit, onDelete }: AllArticlesViewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [articles]);

  const visibleArticles = isExpanded ? sortedArticles : sortedArticles.slice(0, ARTICLES_PREVIEW_LIMIT);

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <p>No pages found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {visibleArticles.map((article) => (
          <KBCard
            key={article.id}
            article={article}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      {sortedArticles.length > ARTICLES_PREVIEW_LIMIT && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Show Less' : `View All ${sortedArticles.length} Pages`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AllArticlesView;