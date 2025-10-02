import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { List, Table as TableIcon, Kanban, ListChecks, LayoutGrid, Eye, EyeOff, ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type TaskSortBy = 'created_at' | 'due_date' | 'priority' | 'title' | 'kanban_order';

interface ProjectsToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode | null) => void;
  kanbanGroupBy: 'status' | 'payment_status';
  onKanbanGroupByChange: (groupBy: 'status' | 'payment_status') => void;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
  taskSortBy: TaskSortBy;
  taskSortDirection: 'asc' | 'desc';
  onTaskSortChange: (by: TaskSortBy, direction: 'asc' | 'desc') => void;
}

const ProjectsToolbar = ({
  view, onViewChange,
  kanbanGroupBy, onKanbanGroupByChange,
  hideCompletedTasks, onToggleHideCompleted,
  taskSortBy, taskSortDirection, onTaskSortChange
}: ProjectsToolbarProps) => {
  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const handleSortByChange = (by: TaskSortBy) => {
    onTaskSortChange(by, taskSortDirection);
  };

  const toggleSortDirection = () => {
    onTaskSortChange(taskSortBy, taskSortDirection === 'asc' ? 'desc' : 'asc');
  };

  const sortLabels: { [key in TaskSortBy]: string } = {
    'created_at': 'Tanggal Dibuat',
    'due_date': 'Batas Waktu',
    'priority': 'Prioritas',
    'title': 'Judul',
    'kanban_order': 'Urutan'
  };

  const TaskViewControls = () => (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button variant="outline" size="sm" onClick={onToggleHideCompleted} className="w-full sm:w-auto">
        {hideCompletedTasks ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
        {hideCompletedTasks ? 'Tampilkan Selesai' : 'Sembunyikan Selesai'}
      </Button>
      <div className="flex gap-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 justify-between w-full">
              <span>Urutkan: {sortLabels[taskSortBy]}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSortByChange('created_at')}>Tanggal Dibuat</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortByChange('due_date')}>Batas Waktu</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortByChange('priority')}>Prioritas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortByChange('title')}>Judul</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortByChange('kanban_order')}>Urutan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={toggleSortDirection} className="w-10">
                {taskSortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ubah Arah Urutan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 pt-2 pb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <TooltipProvider>
          <div className="w-full overflow-x-auto">
            <ToggleGroup type="single" value={view} onValueChange={onViewChange} aria-label="View mode" className="w-full sm:w-auto justify-start">
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tampilan Daftar</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tampilan Tabel</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tampilan Kanban</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks" aria-label="Tasks view"><ListChecks className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tampilan Daftar Tugas</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks-kanban" aria-label="Tasks Kanban view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tampilan Kanban Tugas</p></TooltipContent></Tooltip>
            </ToggleGroup>
          </div>
        </TooltipProvider>
        {isTaskView && <div className="hidden sm:flex"><TaskViewControls /></div>}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {view === 'kanban' && (
          <div className="w-full sm:w-auto">
            <ToggleGroup
              type="single"
              value={kanbanGroupBy}
              onValueChange={(value) => { if (value) onKanbanGroupByChange(value as 'status' | 'payment_status') }}
              className="h-10 w-full"
            >
              <ToggleGroupItem value="status" className="text-sm px-3 flex-1">Berdasarkan Status Proyek</ToggleGroupItem>
              <ToggleGroupItem value="payment_status" className="text-sm px-3 flex-1">Berdasarkan Status Pembayaran</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
        {isTaskView && <div className="flex sm:hidden w-full"><TaskViewControls /></div>}
      </div>
    </div>
  );
};

export default ProjectsToolbar;