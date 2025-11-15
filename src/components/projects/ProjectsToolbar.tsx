import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Search, PlusCircle, Download, RefreshCw, ListPlus } from "lucide-react";
import { DateRange } from "react-day-picker";
import ProjectAdvancedFilters, { AdvancedFiltersState } from './ProjectAdvancedFilters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
      {/* Left Section: View Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <ProjectAdvancedFilters
          filters={advancedFilters}
          onFiltersChange={onAdvancedFiltersChange}
          allPeople={allPeople}
          allOwners={allOwners}
          view={view}
          onViewChange={onViewChange}
          kanbanGroupBy={kanbanGroupBy}
          onKanbanGroupByChange={onKanbanGroupByChange}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={onToggleHideCompleted}
          isTaskView={isTaskView}
        />
        
        {/* Separator for desktop view */}
        <Separator orientation="vertical" className="hidden sm:block h-8" />

        {/* Filters, Search, Date Range */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Right Section: Action Buttons */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Separator for desktop view (moved to the right of filters/search) */}
        <div className="hidden sm:block">
          <Separator orientation="vertical" className="h-8" />
        </div>

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