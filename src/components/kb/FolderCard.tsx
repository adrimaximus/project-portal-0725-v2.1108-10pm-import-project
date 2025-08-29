import { KbFolder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getIconComponent } from '@/data/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface FolderCardProps {
  folder: KbFolder;
  onEdit?: (folder: KbFolder) => void;
  onDelete?: (folder: KbFolder) => void;
}

const FolderCard = ({ folder, onEdit, onDelete }: FolderCardProps) => {
  const Icon = getIconComponent(folder.icon || 'Folder');

  return (
    <Card className="group hover:bg-muted/50 transition-colors" style={{ borderLeft: `4px solid ${folder.color || '#6b7280'}` }}>
      <CardContent className="p-3 flex items-center justify-between">
        <Link to={`/knowledge-base/folders/${folder.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" style={{ color: folder.color }} />
          <span className="font-medium truncate text-sm group-hover:underline">{folder.name}</span>
        </Link>
        {onEdit && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(folder)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(folder)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
};

export default FolderCard;