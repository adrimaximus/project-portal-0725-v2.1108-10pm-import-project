import { KbArticle } from '@/types';
import { KBCard } from './KBCard';

interface ArticleGridViewProps {
  articles: KbArticle[];
}

const ArticleGridView = ({ articles }: ArticleGridViewProps) => {
  return articles.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {articles.map((article) => (
        <KBCard
          key={article.id}
          article={article}
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