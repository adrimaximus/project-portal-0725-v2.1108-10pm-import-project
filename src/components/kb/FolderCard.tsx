import { KbFolder } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface FolderCardProps {
  folder: KbFolder;
}

const FolderCard = ({ folder }: FolderCardProps) => {
  return (
    <Link to={`/knowledge-base/folders/${folder.slug}`} className="block">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6 text-primary" />
            <CardTitle className="truncate">{folder.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground h-10 line-clamp-2">
            {folder.description || 'No description.'}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Updated {formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FolderCard;