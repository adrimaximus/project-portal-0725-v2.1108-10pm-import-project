import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderPlus, Search, LayoutGrid, List, FilePlus, FileText, Folder } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type DisplayMode = 'folders' | 'articles';

interface KnowledgeBaseHeaderProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddNewFolder: () => void;
  onAddNewArticle: () => void;
}

const KnowledgeBaseHeader = ({
  searchTerm,
  onSearchTermChange,
  displayMode,
  onDisplayModeChange,
  viewMode,
  onViewModeChange,
  onAddNewFolder,
  onAddNewArticle,
}: KnowledgeBaseHeaderProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Find and manage your team's pages and documentation.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <ToggleGroup type="single" value={displayMode} onValueChange={(value) => { if (value) onDisplayModeChange(value as DisplayMode)}}>
            <ToggleGroupItem value="folders" aria-label="View Folders"><Folder className="h-4 w-4 mr-2" />Folders</ToggleGroupItem>
            <ToggleGroupItem value="articles" aria-label="View Pages"><FileText className="h-4 w-4 mr-2" />Pages</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) onViewModeChange(value as ViewMode)}}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Grid View</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>List View</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ToggleGroup>
        </div>
      </div>
    </>
  );
};

export default KnowledgeBaseHeader;