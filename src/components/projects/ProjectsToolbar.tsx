import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { List, Table as TableIcon, Kanban, ListChecks, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

interface ProjectsToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (groupBy: 'status' | 'payment_status') => void;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
}

const ProjectsToolbar = ({
  view, onViewChange,
  kanbanGroupBy, onKanbanGroupByChange,
  hideCompletedTasks, onToggleHideCompleted
}: ProjectsToolbarProps) => {
  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  return (
    <div className="px-4 sm:px-6 pt-2 pb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <TooltipProvider>
          <div className="w-full overflow-x-auto">
            <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="View mode" className="w-full sm:w-auto justify-start">
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>List View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Table View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Kanban View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks" aria-label="Tasks view"><ListChecks className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tasks List View</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks-kanban" aria-label="Tasks Kanban view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tasks Kanban View</p></TooltipContent></Tooltip>
            </ToggleGroup>
          </div>
        </TooltipProvider>
        {isTaskView && (
          <Button variant="outline" size="sm" onClick={onToggleHideCompleted} className="hidden sm:flex">
            {hideCompletedTasks ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {hideCompletedTasks ? 'Show Done' : 'Hide Done'}
          </Button>
        )}
      </div>
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
      {isTaskView && (
        <Button variant="outline" size="sm" onClick={onToggleHideCompleted} className="flex sm:hidden w-full">
          {hideCompletedTasks ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {hideCompletedTasks ? 'Show Done' : 'Hide Done'}
        </Button>
      )}
    </div>
  );
};

export default ProjectsToolbar;