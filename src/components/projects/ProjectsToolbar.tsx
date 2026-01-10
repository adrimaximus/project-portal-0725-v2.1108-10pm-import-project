import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare, PlusCircle, Download, RefreshCw, ListPlus, View, X, MoreVertical } from "lucide-react";
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
    return <div className="p-2 border-b h-[57px]" />; 
  }

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex flex-col gap-2 p-2">
        
        {/* Main Toolbar Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
          
          {/* Left Section: View Switcher & Primary Controls */}
          <div className="flex items-center w-full lg:w-auto gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              {/* Desktop View Switcher */}
              <TooltipProvider>
                <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="Project view" className="hidden sm:flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="list" aria-label="List view" size="sm" className="h-8 w-8 p-0"><List className="h-4 w-4" /></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="table" aria-label="Grid view" size="sm" className="h-8 w-8 p-0"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="kanban" aria-label="Kanban view" size="sm" className="h-8 w-8 p-0"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Kanban view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="tasks" aria-label="Tasks list view" size="sm" className="h-8 w-8 p-0"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Tasks list view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view" size="sm" className="h-8 w-8 p-0"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Tasks kanban view</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>

              {view === 'kanban' && (
                <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
                  <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Group by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="payment_status">Payment</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Desktop Task Controls */}
            {isTaskView && (
              <div className="hidden sm:flex items-center gap-2">
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center">
                  <label htmlFor="hide-completed-desktop" className="flex items-center space-x-1.5 cursor-pointer whitespace-nowrap text-xs font-medium px-2 py-1 rounded-md hover:bg-accent/50 transition-colors">
                    <Switch id="hide-completed-desktop" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} className="scale-75 origin-left" />
                    <span>Hide Done</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Filters, Search, Date & Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:justify-end overflow-x-auto no-scrollbar">
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile View Switcher */}
              <div className="sm:hidden flex items-center gap-2 relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsViewSwitcherOpen(!isViewSwitcherOpen)} className="h-8 w-8">
                        <View className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Change view</TooltipContent>
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
                      className="absolute top-9 left-0 z-30 bg-popover border rounded-md shadow-md p-1 flex-col items-start min-w-[140px]"
                    >
                      <ToggleGroupItem value="list" className="w-full justify-start h-8 text-xs"><List className="h-3.5 w-3.5 mr-2" /> List</ToggleGroupItem>
                      <ToggleGroupItem value="table" className="w-full justify-start h-8 text-xs"><LayoutGrid className="h-3.5 w-3.5 mr-2" /> Grid</ToggleGroupItem>
                      <ToggleGroupItem value="kanban" className="w-full justify-start h-8 text-xs"><KanbanSquare className="h-3.5 w-3.5 mr-2" /> Kanban</ToggleGroupItem>
                      <ToggleGroupItem value="tasks" className="w-full justify-start h-8 text-xs"><ListChecks className="h-3.5 w-3.5 mr-2" /> Tasks List</ToggleGroupItem>
                      <ToggleGroupItem value="tasks-kanban" className="w-full justify-start h-8 text-xs"><CheckSquare className="h-3.5 w-3.5 mr-2" /> Tasks Board</ToggleGroupItem>
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
              
              <div className="flex-shrink-0">
                <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} className="w-auto" />
              </div>

              <div className={cn("relative transition-all duration-300 ease-in-out", isSearchOpen ? "flex-1 w-32 sm:w-48" : "w-auto")}>
                {isSearchOpen ? (
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onBlur={() => !searchTerm && setIsSearchOpen(false)}
                      autoFocus
                      className="pl-8 w-full h-8 text-xs"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
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
                        <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} className="h-8 w-8">
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Search</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                {isTaskView ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="default" onClick={onNewTaskClick} className="h-8 w-8">
                          <ListPlus className="h-4 w-4" />
                          <span className="sr-only">Task</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New Task</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="default" onClick={onNewProjectClick} className="h-8 w-8">
                          <PlusCircle className="h-4 w-4" />
                          <span className="sr-only">Project</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New Project</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Desktop: Secondary button is visible */}
                <div className="hidden sm:inline-flex">
                  <TooltipProvider>
                    {isGCalConnected ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={onImportClick} className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Import GCal</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={onRefreshClick} className="h-8 w-8">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>

                {/* Mobile: Secondary actions in a dropdown */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
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
          <div className="sm:hidden flex items-center justify-between pt-1 border-t border-dashed">
            <label htmlFor="hide-completed-mobile" className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-muted-foreground">
              <Switch id="hide-completed-mobile" checked={hideCompletedTasks} onCheckedChange={onToggleHideCompleted} className="scale-75 origin-left" />
              <span>Hide Done</span>
            </label>
            
            {unreadTaskCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMarkAllRead} 
                disabled={isMarkingAllRead}
                className="text-xs h-6 px-2 text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></span>
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