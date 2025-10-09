import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import KnowledgeBaseHeader from '@/components/kb/KnowledgeBaseHeader';
import { useKbArticles } from '@/hooks/useKbArticles';
import { Skeleton } from '@/components/ui/skeleton';
import ArticleCard from '@/components/kb/ArticleCard';
import { BookOpen } from 'lucide-react';

const KnowledgeBasePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: articles, isLoading, error } = useKbArticles({ searchTerm });

  const handleAddNewArticle = () => {
    // TODO: Implement navigation to new article page
    console.log('Add new article');
  };

  const handleAddNewFolder = () => {
    // TODO: Implement modal for new folder
    console.log('Add new folder');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-16">
          <h3 className="text-xl font-semibold">Error loading articles</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
          <BookOpen className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-xl font-semibold">No articles found</h3>
          <p>
            {searchTerm 
              ? "No articles matched your search criteria." 
              : "Get started by creating a new article or folder."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <KnowledgeBaseHeader
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onAddNewArticle={handleAddNewArticle}
          onAddNewFolder={handleAddNewFolder}
        />
        {renderContent()}
      </div>
    </PortalLayout>
  );
};

export default KnowledgeBasePage;