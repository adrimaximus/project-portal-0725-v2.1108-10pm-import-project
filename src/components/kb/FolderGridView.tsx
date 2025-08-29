import { useState, useMemo } from 'react';
import { KbFolder } from '@/types';
import FolderCard from './FolderCard';
import { Button } from '../ui/button';

interface FolderGridViewProps {
  folders: KbFolder[];
  onEdit?: (folder: KbFolder) => void;
  onDelete?: (folder: KbFolder) => void;
}

const FOLDERS_PREVIEW_LIMIT = 8;

const FolderGridView = ({ folders, onEdit, onDelete }: FolderGridViewProps) => {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [folders]);

  const visibleFolders = isFoldersExpanded ? sortedFolders : sortedFolders.slice(0, FOLDERS_PREVIEW_LIMIT);

  if (folders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <p>No other folders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleFolders.map(folder => (
          <FolderCard key={folder.id} folder={folder} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
      {sortedFolders.length > FOLDERS_PREVIEW_LIMIT && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}>
            {isFoldersExpanded ? 'Show Less' : `View All ${sortedFolders.length} Folders`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FolderGridView;