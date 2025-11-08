import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, Kanban } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectsListView from "@/components/projects/ProjectsListView";
import ProjectsKanbanView from "@/components/projects/ProjectsKanbanView";
import TasksView from "@/components/projects/TasksView";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useTasks } from "@/hooks/useTasks";
import { SortingState } from "@tanstack/react-table";

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") || "list";

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView });
  };

  // State management for TasksView
  const [hideDoneTasks, setHideDoneTasks] = useLocalStorage('hideDoneTasks', true);

  const sortColumn = searchParams.get('sortColumn') || 'due_date';
  const sortDirection = searchParams.get('sortDirection') || 'asc';

  const sorting: SortingState = useMemo(() => ([{
    id: sortColumn,
    desc: sortDirection === 'desc',
  }]), [sortColumn, sortDirection]);

  const onSortingChange = (updater: any) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    const params = new URLSearchParams(searchParams);
    if (newSorting.length > 0) {
      params.set('sortColumn', newSorting[0].id);
      params.set('sortDirection', newSorting[0].desc ? 'desc' : 'asc');
    } else {
      params.delete('sortColumn');
      params.delete('sortDirection');
    }
    setSearchParams(params);
  };

  const {
    data: tasksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasks({
    completed: hideDoneTasks ? false : undefined,
    orderBy: sortColumn,
    orderDirection: sortDirection as 'asc' | 'desc',
  });

  const allTasks = useMemo(() => tasksData?.pages.flatMap(page => page) ?? [], [tasksData]);

  return (
    <Tabs value={view} onValueChange={handleViewChange} className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <TabsList>
          <TabsTrigger value="list" className="px-3">
            <List className="h-4 w-4 mr-2" /> List
          </TabsTrigger>
          <TabsTrigger value="kanban" className="px-3">
            <Kanban className="h-4 w-4 mr-2" /> Board
          </TabsTrigger>
          <TabsTrigger value="tasks" className="px-3">
            <LayoutGrid className="h-4 w-4 mr-2" /> Tasks
          </TabsTrigger>
        </TabsList>
      </header>
      <main className="flex-1 overflow-y-auto">
        <TabsContent value="list" className="m-0">
          {view === 'list' && <ProjectsListView />}
        </TabsContent>
        <TabsContent value="kanban" className="m-0">
          {view === 'kanban' && <ProjectsKanbanView />}
        </TabsContent>
        <TabsContent value="tasks" className="m-0 h-full">
          {view === 'tasks' && (
            <TasksView
              tasks={allTasks}
              isLoading={isLoadingTasks}
              error={tasksError}
              hideDoneTasks={hideDoneTasks}
              setHideDoneTasks={setHideDoneTasks}
              sorting={sorting}
              onSortingChange={onSortingChange}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </TabsContent>
      </main>
    </Tabs>
  );
};

export default ProjectsPage;