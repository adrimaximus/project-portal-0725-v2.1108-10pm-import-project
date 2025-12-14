import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare, PlusCircle, Download, RefreshCw, ListPlus, View, CheckCircle2, X, MoreVertical } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ProjectAdvancedFilters, { AdvancedFiltersState } from './ProjectAdvancedFilters';
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  unreadTaskCount?: number;
  onMarkAllRead?: () => void;
  isMarkingAllRead?: boolean;
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
  unreadTaskCount = 0,
  onMarkAllRead,
  isMarkingAllRead,
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
    <div className="w-full border-t bg-background">
      <div className="flex flex-col gap-3 p-3 sm:p-4">
        
        {/* Main Toolbar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left Section: View Switcher & Primary Controls */}
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
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

              {view === 'kanban' && (
                <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
                  <SelectTrigger className="w-[110px] sm:w-[130px] h-9"><SelectValue placeholder="Group by..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="payment_status">Payment</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Desktop Task Controls */}
            {isTaskView && (
              <div className="hidden sm:flex items-center gap-3">
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center space-x-2">
                  <label htmlFor="hide-completed-desktop" className="flex items-center space-x-2 cursor-pointer whitespace-nowrap text-sm">
                    <Switch id="hide-completed-desktop" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} />
                    <span>Hide Done</span>
                  </label>
                </div>
                {unreadTaskCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onMarkAllRead} 
                    disabled={isMarkingAllRead}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 h-8 px-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    {unreadTaskCount} new
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Filters, Search, Date & Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
            
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Mobile View Switcher */}
              <div className="sm:hidden flex items-center gap-2 relative">
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
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsViewSwitcherOpen(false)} />
                    <ToggleGroup
                      type="single"
                      value={view}
                      onValueChange={(value: ViewMode | null) => {
                        if (value) onViewChange(value);
                        setIsViewSwitcherOpen(false);
                      }}
                      aria-label="Project view"
                      className="absolute top-10 left-0 z-30 bg-popover border rounded-md shadow-md p-1 flex-col items-start"
                    >
                      <ToggleGroupItem value="list" className="w-full justify-start"><List className="h-4 w-4 mr-2" /> List</ToggleGroupItem>
                      <ToggleGroupItem value="table" className="w-full justify-start"><LayoutGrid className="h-4 w-4 mr-2" /> Grid</ToggleGroupItem>
                      <ToggleGroupItem value="kanban" className="w-full justify-start"><KanbanSquare className="h-4 w-4 mr-2" /> Kanban</ToggleGroupItem>
                      <ToggleGroupItem value="tasks" className="w-full justify-start"><ListChecks className="h-4 w-4 mr-2" /> Tasks List</ToggleGroupItem>
                      <ToggleGroupItem value="tasks-kanban" className="w-full justify-start"><CheckSquare className="h-4 w-4 mr-2" /> Tasks Board</ToggleGroupItem>
                    </ToggleGroup>
                  </>
                )}
              </div>

              <ProjectAdvancedFilters
                filters={advancedFilters}
                onAdvancedFiltersChange={onAdvancedFiltersChange}
                allPeople={allPeople}
                allOwners={allOwners}
              />
              
              <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} className="flex-1 sm:flex-none" />

              <div className={cn("relative transition-all duration-300 ease-in-out", isSearchOpen ? "flex-1 sm:w-48" : "w-auto")}>
                {isSearchOpen ? (
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onBlur={() => !searchTerm && setIsSearchOpen(false)}
                      autoFocus
                      className="pl-8 w-full h-9"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        onSearchChange("");
                        setIsSearchOpen(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} className="h-9 w-9">
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Search</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                {isTaskView ? (
                  <Button size="sm" variant="default" onClick={onNewTaskClick} className="h-9 px-3 gap-1">
                    <ListPlus className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Task</span>
                  </Button>
                ) : (
                  <Button size="sm" variant="default" onClick={onNewProjectClick} className="h-9 px-3 gap-1">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Project</span>
                  </Button>
                )}
                
                {/* Desktop: Secondary button is visible */}
                <div className="hidden sm:inline-flex">
                  <TooltipProvider>
                    {isGCalConnected ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={onImportClick} className="h-9 w-9">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Import from Google Calendar</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={onRefreshClick} className="h-9 w-9">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Refresh Data</p></TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>

                {/* Mobile: Secondary actions in a dropdown */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isGCalConnected ? (
                        <DropdownMenuItem onClick={onImportClick}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Import from GCal</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={onRefreshClick}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span>Refresh Data</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Only Task Filters (Row 2) */}
        {isTaskView && (
          <div className="sm:hidden flex items-center justify-between pt-2 border-t border-dashed">
            <label htmlFor="hide-completed-mobile" className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-muted-foreground">
              <Switch id="hide-completed-mobile" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} className="scale-75 origin-left" />
              <span>Hide Completed</span>
            </label>
            
            {unreadTaskCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMarkAllRead} 
                disabled={isMarkingAllRead}
                className="text-xs h-7 px-2 text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5"></span>
                Mark {unreadTaskCount} read
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsToolbar;