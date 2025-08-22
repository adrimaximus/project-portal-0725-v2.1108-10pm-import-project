import { KbFolder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { getIconComponent } from '@/data/icons';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface FolderListViewProps {
  folders: KbFolder[];
  onEdit: (folder: KbFolder) => void;
  onDelete: (folder: KbFolder) => void;
}

const FolderListView = ({ folders, onEdit, onDelete }: FolderListViewProps) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map(folder => {
            const Icon = getIconComponent(folder.icon || 'Folder');
            return (
              <TableRow key={folder.id}>
                <TableCell>
                  <Link to={`/knowledge-base/folders/${folder.slug}`} className="flex items-center gap-3 group font-medium text-primary hover:underline">
                    <Icon className="h-5 w-5 flex-shrink-0" style={{ color: folder.color }} />
                    <span className="truncate">{folder.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  {folder.category ? <Badge variant="secondary">{folder.category}</Badge> : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default FolderListView;