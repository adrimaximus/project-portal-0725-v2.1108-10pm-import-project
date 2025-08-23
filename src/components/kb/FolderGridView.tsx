import { KbFolder, KbArticle } from '@/types';
import FolderCard from './FolderCard';
import PageListView from './PageListView';

interface FolderGridViewProps {
  folders: KbFolder[];
  articles: KbArticle[];
  onEditFolder: (folder: KbFolder) => void;
  onDeleteFolder: (folder: KbFolder) => void;
  onEditArticle: (article: KbArticle) => void;
  onDeleteArticle: (article: KbArticle) => void;
}

const FolderGridView = ({ folders, articles, onEditFolder, onDeleteFolder, onEditArticle, onDeleteArticle }: FolderGridViewProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Folders</h2>
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map(folder => (
              <FolderCard key={folder.id} folder={folder} onEdit={onEditFolder} onDelete={onDeleteFolder} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No folders found.</p>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">All Pages</h2>
        {articles.length > 0 ? (
          <PageListView 
            articles={articles} 
            onEdit={onEditArticle} 
            onDelete={onDeleteArticle} 
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No pages found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderGridView;