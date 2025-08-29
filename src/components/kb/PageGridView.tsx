import { KbArticle } from '@/types';
import { KBCard } from './KBCard';

interface PageGridViewProps {
  articles: KbArticle[];
  onEdit: (article: KbArticle) => void;
  onDelete: (article: KbArticle) => void;
}

const PageGridView = ({ articles, onEdit, onDelete }: PageGridViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {articles.map((article) => (
        <KBCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default PageGridView;