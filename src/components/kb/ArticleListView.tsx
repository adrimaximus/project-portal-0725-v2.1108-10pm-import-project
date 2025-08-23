import { KbArticle } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react';

interface ArticleListViewProps {
  articles: KbArticle[];
  onEdit: (article: KbArticle) => void;
  onDelete: (article: KbArticle) => void;
}

const ArticleListView = ({ articles, onEdit, onDelete }: ArticleListViewProps) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map(article => (
            <TableRow key={article.id}>
              <TableCell>
                <Link to={`/knowledge-base/articles/${article.slug}`} className="flex items-center gap-3 group font-medium text-primary hover:underline">
                  <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">{article.title}</span>
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/knowledge-base/folders/${article.kb_folders.slug}`} className="text-sm text-muted-foreground hover:underline">
                  {article.kb_folders.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(article)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(article)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ArticleListView;