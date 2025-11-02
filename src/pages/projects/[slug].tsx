import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProjectBySlug } from '@/lib/projectsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectActivityFeed from '@/components/project-detail/ProjectActivityFeed';
import ProjectTasks from '@/components/project-detail/ProjectTasks';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Task, UpsertTaskPayload } from '@/types';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { upsertTask, deleteTask, toggleTaskCompletion, isUpserting } = useTaskMutations();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!project) return;

    const channel = supabase
      .channel(`project-updates-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', slug] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_activities',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', slug] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project, slug, queryClient]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          toast.success(`Task "${taskToDelete.title}" deleted.`);
        },
      });
      setTaskToDelete(null);
    }
  };

  const handleTaskFormSubmit = (data: UpsertTaskPayload) => {
    upsertTask(data, {
      onSuccess: () => {
        setIsTaskFormOpen(false);
        setEditingTask(null);
      },
    });
  };

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading project: {error.message}</div>;
  }

  if (!project) {
    return <div className="p-4">Project not found.</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-2">{project.description}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectTasks
                  tasks={project.tasks || []}
                  projectId={project.id}
                  onAddTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTaskCompletion={handleToggleTaskCompletion}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectActivityFeed activities={project.activities || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleTaskFormSubmit}
        isSubmitting={isUpserting}
        task={editingTask}
        project={project}
      />
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{taskToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectDetailPage;