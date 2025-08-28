import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { List, Table as TableIcon, Kanban, CalendarPlus, Search, ListChecks, LayoutGrid } from "lucide-react";

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar' | 'tasks' | 'tasks-kanban';

interface ProjectsToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (groupBy: 'status' | 'payment_status') => void;
}

const ProjectsToolbar = ({
  view, onViewChange, searchTerm, onSearchTermChange, dateRange, onDateRangeChange,
  kanbanGroupBy, onKanbanGroupByChange
}: ProjectsToolbarProps) => {
  return (
    <div className="flex flex-col flex-shrink-0 border-b bg-background">
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:flex-1">
          <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} />
        </div>
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>
      <div className="px-4 sm:px-6 pt-2 pb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <TooltipProvider>
          <div className="w-full overflow-x-auto">
            <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="View mode" className="w-full sm:w-auto justify-start">
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>List View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Table View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Kanban View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks" aria-label="Tasks view"><ListChecks className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tasks List View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks-kanban" aria-label="Tasks Kanban view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tasks Kanban View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="calendar" aria-label="Calendar Import view"><CalendarPlus className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Calendar Import</p></TooltipContent></Tooltip>
            </ToggleGroup>
          </div>
        </TooltipProvider>
        {view === 'kanban' && (
          <div className="w-full sm:w-auto">
            <ToggleGroup
              type="single"
              value={kanbanGroupBy}
              onValueChange={(value) => { if (value) onKanbanGroupByChange(value as 'status' | 'payment_status') }}
              className="h-10 w-full"
            >
              <ToggleGroupItem value="status" className="text-sm px-3 flex-1">By Project Status</ToggleGroupItem>
              <ToggleGroupItem value="payment_status" className="text-sm px-3 flex-1">By Payment Status</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsToolbar;