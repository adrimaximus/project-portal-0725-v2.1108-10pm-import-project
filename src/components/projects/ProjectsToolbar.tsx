import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Table as TableIcon, Kanban, List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare, PlusCircle, Download, RefreshCw, ListPlus, View } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ProjectAdvancedFilters, { AdvancedFiltersState } from './ProjectAdvancedFilters';
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onNewProjectClick: () => void;
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
  onNewProjectClick,
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
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isViewSwitcherOpen, setIsViewSwitcherOpen] = useState(false);

  return (
    <div className="p-4 border-t flex flex-nowrap items-center justify-between gap-4 overflow-x-auto">
      {/* Left Section: View Controls */}
      <div className="flex items-center gap-4 flex-nowrap">
        {/* Desktop View Switcher */}
        <TooltipProvider>
          <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="Project view" className="hidden sm:flex">
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

        {/* Mobile View Switcher */}
        <div className="sm:hidden flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsViewSwitcherOpen(!isViewSwitcherOpen)}>
                  <View className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Change view</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isViewSwitcherOpen && (
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value: ViewMode | null) => {
                if (value) onViewChange(value);
                setIsViewSwitcherOpen(false);
              }}
              aria-label="Project view"
            >
              <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="kanban" aria-label="Kanban view"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="tasks" aria-label="Tasks list view"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

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
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="hide-completed" className="flex items-center space-x-2 cursor-pointer">
                    <Switch id="hide-completed" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} />
                    <span className="text-sm hidden sm:inline">Hide Done</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hide Done</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Right Section: Filters, Search, Date Range, and Action Buttons */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-nowrap justify-end">
        
        {/* Filters, Search, Date Range */}
        <div className="flex items-center gap-2">
          <ProjectAdvancedFilters
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
            allPeople={allPeople}
            allOwners={allOwners}
          />
          {isMobile ? (
            isSearchOpen ? (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
                  autoFocus
                  className="pl-9 w-full"
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
                  <TooltipContent><p>Search</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          ) : (
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-full sm:w-48"
              />
            </div>
          )}
          <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} />
        </div>

        {/* Separator for desktop view */}
        <Separator orientation="vertical" className="hidden sm:block h-8" />

        {/* Action Buttons (New Project/Task, Import/Refresh) */}
        <div className="flex items-center gap-2">
          {isTaskView ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={onNewTaskClick}>
                    <ListPlus className="h-4 w-4" />
                    <span className="sr-only">New Task</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>New Task</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={onNewProjectClick}>
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">New Project</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>New Project</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isGCalConnected ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onImportClick}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Import from Calendar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Import from Calendar</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onRefreshClick}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh data</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Refresh data</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsToolbar;