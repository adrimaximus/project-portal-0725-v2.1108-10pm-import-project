import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { List, Table as TableIcon, Kanban, CalendarPlus, Search, RefreshCw, Sparkles, Loader2 } from "lucide-react";

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar';

interface ProjectsToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (groupBy: 'status' | 'payment_status') => void;
  onRefreshProjects: () => void;
  onRefreshCalendar: () => void;
  onAiImport: () => void;
  isAiImporting: boolean;
}

const ProjectsToolbar = ({
  view, onViewChange, searchTerm, onSearchTermChange, dateRange, onDateRangeChange,
  kanbanGroupBy, onKanbanGroupByChange, onRefreshProjects, onRefreshCalendar, onAiImport, isAiImporting
}: ProjectsToolbarProps) => {
  return (
    <>
      <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 items-center flex-shrink-0 border-b">
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
      {view === 'kanban' && (
        <div className="px-6 pt-4 flex justify-center sm:justify-start">
          <ToggleGroup
            type="single"
            value={kanbanGroupBy}
            onValueChange={(value) => { if (value) onKanbanGroupByChange(value as 'status' | 'payment_status') }}
            className="h-10"
          >
            <ToggleGroupItem value="status" className="text-sm px-3">By Project Status</ToggleGroupItem>
            <ToggleGroupItem value="payment_status" className="text-sm px-3">By Payment Status</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </>
  );
};

export default ProjectsToolbar;