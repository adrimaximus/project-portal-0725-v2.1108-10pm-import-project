import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Search, FilePlus } from 'lucide-react';

interface KnowledgeBaseHeaderProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onAddNewFolder: () => void;
  onAddNewArticle: () => void;
}

const KnowledgeBaseHeader = ({
  searchTerm,
  onSearchTermChange,
  onAddNewFolder,
  onAddNewArticle,
}: KnowledgeBaseHeaderProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Find and manage your team's pages and documentation.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button onClick={onAddNewArticle} variant="outline" className="w-full">
            <FilePlus className="mr-2 h-4 w-4" /> New Page
          </Button>
          <Button onClick={onAddNewFolder} className="w-full">
            <FolderPlus className="mr-2 h-4 w-4" /> New Folder
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>
    </>
  );
};

export default KnowledgeBaseHeader;