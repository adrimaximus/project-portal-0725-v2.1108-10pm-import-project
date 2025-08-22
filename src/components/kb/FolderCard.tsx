import { KbFolder } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { getIconComponent } from '@/data/icons';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface FolderCardProps {
  folder: KbFolder;
  onEdit: (folder: KbFolder) => void;
  onDelete: (folder: KbFolder) => void;
}

const FolderCard = ({ folder, onEdit, onDelete }: FolderCardProps) => {
  const Icon = getIconComponent(folder.icon || 'Folder');

  return (
    <Link to={`/knowledge-base/folders/${folder.slug}`} className="block group h-full">
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col" style={{ borderTop: `4px solid ${folder.color || '#6b7280'}` }}>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-6 w-6 text-primary flex-shrink-0" />
            <CardTitle className="truncate group-hover:underline">{folder.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(folder); }}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(folder); }} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground h-10 line-clamp-2">
            {folder.description || 'No description.'}
          </p>
          {folder.category && (
            <div className="mt-2">
              <Badge variant="secondary">{folder.category}</Badge>
            </div>
          )}
        </CardContent>
        <div className="p-4 pt-0 text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true })}
        </div>
      </Card>
    </Link>
  );
};

export default FolderCard;