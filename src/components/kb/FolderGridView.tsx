import { useState } from 'react';
import { KbFolder, KbArticle } from '@/types';
import FolderCard from './FolderCard';
import PageListView from './PageListView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderGridViewProps {
  folders: KbFolder[];
  articles: KbArticle[];
  onEditFolder: (folder: KbFolder) => void;
  onDeleteFolder: (folder: KbFolder) => void;
  onEditArticle: (article: KbArticle) => void;
  onDeleteArticle: (article: KbArticle) => void;
}

const FolderGridView = ({ folders, articles, onEditFolder, onDeleteFolder, onEditArticle, onDeleteArticle }: FolderGridViewProps) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  return (
    <div className="space-y-8">
      <Collapsible open={isFoldersOpen} onOpenChange={setIsFoldersOpen}>
        <CollapsibleTrigger className="w-full flex items-center gap-2 mb-4 cursor-pointer">
          <ChevronRight className={cn("h-5 w-5 transition-transform", isFoldersOpen && "rotate-90")} />
          <h2 className="text-xl font-semibold">Folders</h2>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
      
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