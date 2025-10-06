import { KbFolder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, MoreHorizontal, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMemo, useState } from 'react';

interface FolderListViewProps {
  folders: KbFolder[];
  onFolderSelect: (folder: KbFolder) => void;
  onEdit: (folder: KbFolder) => void;
  onDelete: (folder: KbFolder) => void;
}

type SortKey = keyof KbFolder;

const FolderListView = ({ folders, onFolderSelect, onEdit, onDelete }: FolderListViewProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  const sortedFolders = useMemo(() => {
    let sortableItems = [...folders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue === undefined || aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [folders, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Button variant="ghost" onClick={() => requestSort('name')} className="px-2">Name {getSortIcon('name')}</Button></TableHead>
          <TableHead><Button variant="ghost" onClick={() => requestSort('category')} className="px-2">Category {getSortIcon('category')}</Button></TableHead>
          <TableHead><Button variant="ghost" onClick={() => requestSort('updated_at')} className="px-2">Last Modified {getSortIcon('updated_at')}</Button></TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedFolders.map(folder => (
          <TableRow key={folder.id} className="cursor-pointer" onClick={() => onFolderSelect(folder)}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" style={{ color: folder.color || 'currentColor' }} />
                <span className="font-medium">{folder.name}</span>
              </div>
            </TableCell>
            <TableCell>
              {folder.category ? <Badge variant="secondary">{folder.category}</Badge> : '-'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {folder.updated_at ? formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true }) : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              {/* Actions can be added here */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default FolderListView;