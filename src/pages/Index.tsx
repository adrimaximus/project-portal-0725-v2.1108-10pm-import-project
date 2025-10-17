import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import TableView from '@/components/projects/TableView';
import TasksView from '@/components/projects/TasksView';
import { Project, Task } from '@/types';
import { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Search } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import ProjectViewContainer from '@/components/projects/ProjectViewContainer';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { GoogleCalendarImportDialog } from '@/components/projects/GoogleCalendarImportDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useTaskMutations, UpsertTaskPayload } from '@/hooks/useTaskMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import PortalLayout from '@/components/PortalLayout';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type SortConfig<T> = { key: keyof T | null; direction: 'ascending' | 'descending' };

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', { p_limit: 500, p_offset: 0 });
  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase.rpc('get_project_tasks');
  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const navigate = useNavigate();

  const view = (searchParams.get('view') as ViewMode) || 'table';
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projectsData = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useProjects({ searchTerm });
  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({ hideCompleted: hideCompletedTasks, sortConfig: { key: 'due_date', direction: 'asc' } });

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    showOnlyMultiPerson: false,
    hiddenStatuses: [],
    selectedPeopleIds: [],
  });

  const allPeople = useMemo(() => {
    if (!projectsData) return [];
    const peopleMap = new Map<string, { id: string; name: string }>();
    projectsData.forEach(project => {
      project.assignedTo?.forEach(person => {
        if (!peopleMap.has(person.id)) {
          peopleMap.set(person.id, { id: person.id, name: person.name });
        }
      });
    });
    return Array.from(peopleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projectsData]);

  const {
    dateRange, setDateRange,
    sortConfig: projectSortConfig, requestSort: requestProjectSort, sortedProjects
  } = useProjectFilters(projectsData, advancedFilters);

  const [taskSortConfig, setTaskSortConfig] = useState<{ key: keyof Task | string; direction: 'asc' | 'desc' }>({ key: 'due_date', direction: 'asc' });

  const { mutate: toggleTaskCompletion, isPending: isToggling } = useMutation({
    mutationFn: async ({ task, completed }: { task: Task, completed: boolean }) => {
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
          onToggleTaskCompletion={toggleTaskCompletion}
          isToggling={isToggling}
          sortConfig={taskSortConfig}
          requestSort={(key) => requestProjectSort(key as keyof Project)}
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
      <Toaster />
    </div>
  );
};

export default Index;