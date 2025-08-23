import { KbArticle } from '@/types';
import { KBCard } from './KBCard';

interface PageGridViewProps {
  articles: KbArticle[];
  onEdit: (article: KbArticle) => void;
  onDelete: (article: KbArticle) => void;
}

const PageGridView = ({ articles, onEdit, onDelete }: PageGridViewProps) => {
  return articles.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {articles.map((article) => (
        <KBCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  ) : (
    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
      <p>No pages found.</p>
    </div>
  );
};

export default PageGridView;