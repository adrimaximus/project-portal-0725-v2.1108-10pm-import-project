import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, LayoutGrid, KanbanSquare, ListChecks, CheckSquare, PlusCircle, Download, RefreshCw, ListPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateRange } from "react-day-picker";
import ProjectAdvancedFilters, { AdvancedFiltersState } from './ProjectAdvancedFilters';
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
  onNewProjectClick: () => void;
  onNewTaskClick: () => void;
  isTaskView: boolean;
  isGCalConnected: boolean | undefined;
  onImportClick: () => void;
  onRefreshClick: () => void;
  advancedFilters: AdvancedFiltersState;
  onAdvancedFiltersChange: (filters: AdvancedFiltersState) => void;
  allPeople: Person[];
};

const ProjectsToolbar = ({
  view,
  onViewChange,
  kanbanGroupBy,
  onKanbanGroupByChange,
  hideCompletedTasks,
  onToggleHideCompleted,
  onNewProjectClick,
  onNewTaskClick,
  isTaskView,
  isGCalConnected,
  onImportClick,
  onRefreshClick,
  advancedFilters,
  onAdvancedFiltersChange,
  allPeople,
}: ProjectsToolbarProps) => {
  return (
    <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="w-full sm:w-auto flex-shrink-0 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="Project view">
            <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view"><KanbanSquare className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tasks" aria-label="Tasks list view"><ListChecks className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tasks-kanban" aria-label="Tasks kanban view"><CheckSquare className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>

          {view === 'kanban' && (
            <Select value={kanbanGroupBy} onValueChange={onKanbanGroupByChange}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Group by..." /></SelectTrigger>
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
        
        <Separator orientation="vertical" className="h-6" />

        <ProjectAdvancedFilters filters={advancedFilters} onFiltersChange={onAdvancedFiltersChange} allPeople={allPeople} />
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex items-center gap-2">
        {isTaskView ? (
          <Button size="icon" variant="outline" onClick={onNewTaskClick}>
            <ListPlus className="h-4 w-4" />
            <span className="sr-only">New Task</span>
          </Button>
        ) : (
          <Button size="icon" variant="outline" onClick={onNewProjectClick}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">New Project</span>
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

      {/* Mobile Action Buttons */}
      <div className="sm:hidden flex items-center gap-2">
        {isTaskView ? (
          <Button size="icon" variant="outline" onClick={onNewTaskClick}>
            <ListPlus className="h-4 w-4" />
            <span className="sr-only">New Task</span>
          </Button>
        ) : (
          <Button size="icon" variant="outline" onClick={onNewProjectClick}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">New Project</span>
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