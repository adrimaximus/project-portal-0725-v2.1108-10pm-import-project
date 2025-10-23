import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDashboardProjects, createProject, updateProjectDetails, deleteProject } from '@/api/projects';
import { getProjectTasks, upsertTask, deleteTask, toggleTaskCompletion } from '@/api/tasks';
import { getPeople } from '@/api/people';
import { Project, Task as ProjectTask, Person } from '@/types';
import { toast } from 'sonner';

import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import TableView from '@/components/projects/TableView';
import TasksView from '@/components/projects/TasksView';
import { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import ProjectViewContainer from '@/components/projects/ProjectViewContainer';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { GoogleCalendarImportDialog } from '@/components/projects/GoogleCalendarImportDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useTaskMutations, UpsertTaskPayload } from '@/hooks/useTaskMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import PortalLayout from '@/components/PortalLayout';
import { formatInJakarta } from '@/lib/utils';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type SortConfig<T> = { key: keyof T | null; direction: 'ascending' | 'descending' };

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const navigate = useNavigate();

  const view = (searchParams.get('view') as ViewMode) || 'table';
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: projectsData = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useProjects({ searchTerm });
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    hiddenStatuses: [],
    selectedPeopleIds: [],
    status: [],
    assignees: [],
    dueDate: null,
  });

  const { data: peopleData } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: getPeople,
  });

  const allPeople = useMemo(() => {
    if (!peopleData) return [];
    return peopleData.map(p => ({ id: p.id, name: p.full_name }));
  }, [peopleData]);

  const {
    dateRange, setDateRange,
    sortConfig: projectSortConfig, requestSort: requestProjectSort, sortedProjects
  } = useProjectFilters(projectsData, advancedFilters);

  const [taskSortConfig, setTaskSortConfig] = useState<{ key: keyof ProjectTask | string; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });

  const requestTaskSort = useCallback((key: string) => {
    setTaskSortConfig(prevConfig => {
      let direction: 'asc' | 'desc' = 'asc';
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const finalTaskSortConfig = view === 'tasks-kanban' ? { key: 'kanban_order', direction: 'asc' as const } : taskSortConfig;

  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({
    hideCompleted: hideCompletedTasks,
    sortConfig: finalTaskSortConfig,
  });

  const { mutate: toggleTaskCompletion, isPending: isToggling } = useMutation({
    mutationFn: async ({ task, completed }: { task: ProjectTask, completed: boolean }) => {
      const { error } = await supabase.from('tasks').update({ completed }).eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task updated.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast.error(`Error updating task: ${error.message}`);
    }
  });

  const handleToggleTaskCompletion = (task: ProjectTask, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) setSearchParams({ view: newView });
  };

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const renderView = () => {
    switch (view) {
      case 'table':
        return <TableView 
          projects={sortedProjects} 
          isLoading={isLoadingProjects}
          onDeleteProject={() => toast.error("Delete not implemented.")}
          sortConfig={projectSortConfig}
          requestSort={(key) => requestProjectSort(key as keyof Project)}
          rowRefs={rowRefs}
        />;
      case 'tasks':
        return <TasksView 
          tasks={tasksData} 
          isLoading={isLoadingTasks}
          onEdit={() => toast.info("Edit not implemented.")}
          onDelete={() => toast.error("Delete not implemented.")}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          isToggling={isToggling}
          sortConfig={taskSortConfig}
          requestSort={requestTaskSort}
        />;
      default:
        return (
          <div className="p-8 text-center">
            <p>View '{view}' not implemented.</p>
            <p>Please select another view.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
        <ProjectsToolbar
          view={view}
          onViewChange={handleViewChange}
          kanbanGroupBy={kanbanGroupBy}
          onKanbanGroupByChange={setKanbanGroupBy}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(prev => !prev)}
          onNewProjectClick={() => toast.info("New project form not implemented.")}
          onNewTaskClick={() => toast.info("New task form not implemented.")}
          isTaskView={isTaskView}
          isGCalConnected={false}
          onImportClick={() => {}}
          onRefreshClick={() => {
            toast.info("Refreshing data...");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          allPeople={allPeople}
        />
      </main>
    </div>
  );
};

export default Index;