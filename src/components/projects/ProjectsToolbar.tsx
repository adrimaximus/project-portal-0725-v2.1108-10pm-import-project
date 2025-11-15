import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Table as TableIcon, Kanban, List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare, PlusCircle, Download, RefreshCw, ListPlus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ProjectAdvancedFilters, { AdvancedFiltersState } from './ProjectAdvancedFilters';
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

interface Person {
  id: string;
  name: string;
}

type ProjectsToolbarProps = {
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (value: 'status' | 'payment_status') => void;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
  onNewTaskClick: () => void;
  isTaskView: boolean;
  isGCalConnected: boolean | undefined;
  onImportClick: () => void;
  onRefreshClick: () => void;
  advancedFilters: AdvancedFiltersState;
  onAdvancedFiltersChange: (filters: AdvancedFiltersState) => void;
  allPeople: Person[];
  allOwners: Person[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
};

const ProjectsToolbar = ({
  view,
  onViewChange,
  kanbanGroupBy,
  onKanbanGroupByChange,
  hideCompletedTasks,
  onToggleHideCompleted,
  onNewTaskClick,
  isTaskView,
  isGCalConnected,
  onImportClick,
  onRefreshClick,
  advancedFilters,
  onAdvancedFiltersChange,
  allPeople,
  allOwners,
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: ProjectsToolbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="w-full sm:w-auto flex-shrink-0 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="Project view">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>List view</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="table" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Grid view</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="kanban" aria-label="Kanban view"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Kanban view</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="tasks" aria-label="Tasks list view"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Tasks list view</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent><p>Tasks kanban view</p></TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>

          {view === 'kanban' && (
            <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
              <SelectTrigger className="w-[80px]"><SelectValue placeholder="Group by..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="payment_status">Payment Status</SelectItem>
              </SelectContent>
            </Select>
          )}
          {isTaskView && (
            <div className="flex items-center space-x-2">
              <Switch id="hide-completed" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} />
              <Label htmlFor="hide-completed" className="text-sm">Hide Done</Label>
            </div>
          )}
        </div>
      </div>

      <div className="w-full sm:w-auto flex items-center gap-2">
        <ProjectAdvancedFilters
          filters={advancedFilters}
          onFiltersChange={onAdvancedFiltersChange}
          allPeople={allPeople}
          allOwners={allOwners}
        />
        {isSearchOpen ? (
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchTerm) {
                  setIsSearchOpen(false);
                }
              }}
              autoFocus
              className="pl-9 w-full sm:w-48"
            />
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} />
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex items-center gap-2">
        {isTaskView ? (
          <Button size="icon" variant="outline" onClick={onNewTaskClick}>
            <ListPlus className="h-4 w-4" />
            <span className="sr-only">New Task</span>
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" asChild>
                  <Link to="/request">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">New Project</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>New Project</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isGCalConnected ? (
          <Button variant="outline" size="icon" onClick={onImportClick}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Import from Calendar</span>
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={onRefreshClick}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh data</span>
          </Button>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden flex items-center gap-2">
        {isTaskView ? (
          <Button size="icon" variant="outline" onClick={onNewTaskClick}>
            <ListPlus className="h-4 w-4" />
            <span className="sr-only">New Task</span>
          </Button>
        ) : (
          <Button size="icon" variant="outline" asChild>
            <Link to="/request">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">New Project</span>
            </Link>
          </Button>
        )}
        {isGCalConnected ? (
          <Button variant="outline" size="icon" onClick={onImportClick}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Import from Calendar</span>
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={onRefreshClick}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh data</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectsToolbar;