import { useState, useEffect } from "react";
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
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isViewSwitcherOpen, setIsViewSwitcherOpen] = useState(false);

  if (!hasMounted) {
    return <div className="p-4 border-t h-[73px]" />; // Placeholder to prevent layout shift
  }

  return (
    <div className="p-4 border-t flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      {/* Left Section: View Controls */}
      <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto justify-between lg:justify-start">
        <div className="flex items-center gap-2">
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
                className="absolute top-16 left-4 z-50 bg-background border rounded-md shadow-lg p-1"
              >
                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="kanban" aria-label="Kanban view"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="tasks" aria-label="Tasks list view"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === 'kanban' && (
            <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
              <SelectTrigger className="w-[110px] sm:w-[130px] h-9"><SelectValue placeholder="Group by..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="payment_status">Payment</SelectItem>
              </SelectContent>
            </Select>
          )}
          {isTaskView && (
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label htmlFor="hide-completed" className="flex items-center space-x-2 cursor-pointer bg-secondary/50 px-2 py-1.5 rounded-md hover:bg-secondary">
                      <Switch id="hide-completed" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} className="scale-75 data-[state=checked]:bg-primary" />
                      <span className="text-xs font-medium whitespace-nowrap">Hide Done</span>
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
      </div>

      {/* Right Section: Filters, Search, Date Range, and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto lg:justify-end">
        
        {/* Filters, Search, Date Range */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex-1 sm:flex-none flex items-center gap-2">
            <ProjectAdvancedFilters
              filters={advancedFilters}
              onFiltersChange={onAdvancedFiltersChange}
              allPeople={allPeople}
              allOwners={allOwners}
            />
            {isSearchOpen ? (
              <div className="relative flex-1 sm:flex-initial sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
                  autoFocus
                  className="pl-9 h-9 w-full sm:w-48"
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
            )}
          </div>
          
          <div className="flex-1 sm:flex-none min-w-[240px]">
             <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} className="w-full" />
          </div>
        </div>

        {/* Separator for desktop view */}
        <Separator orientation="vertical" className="hidden lg:block h-8 mx-2" />

        {/* Action Buttons (New Project/Task, Import/Refresh) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0 border-border">
          {isTaskView ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onNewTaskClick} className="h-9">
                    <ListPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Task</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>New Task</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onNewProjectClick} className="h-9">
                    <PlusCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Project</span>
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
                  <Button variant="outline" size="icon" onClick={onImportClick} className="h-9 w-9">
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
                  <Button variant="outline" size="icon" onClick={onRefreshClick} className="h-9 w-9">
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