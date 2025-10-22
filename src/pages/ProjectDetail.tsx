import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectTeamCard from "@/components/project-detail/ProjectTeamCard";
import ProjectDetailsCard from "@/components/project-detail/ProjectDetailsCard";
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
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/hooks/useProject";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { toast } from "sonner";
import { Project, Task } from "@/types";
import TaskFormDialog from "@/components/projects/TaskFormDialog";
import { useTaskMutations, UpsertTaskPayload } from "@/hooks/useTaskMutations";
import { useTasks } from "@/hooks/useTasks";

const ProjectDetailSkeleton = () => (
  <PortalLayout>
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  </PortalLayout>
);

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { data: project, isLoading, error } = useProject(slug!);
  const { data: tasks, isLoading: isLoadingTasks } = useTasks({
    projectIds: project ? [project.id] : [],
    enabled: !!project,
    sortConfig: { key: 'created_at', direction: 'asc' }
  });
  const mutations = useProjectMutations(slug!);
  const { upsertTask, deleteTask, toggleTaskCompletion, isUpserting } = useTaskMutations();

  const defaultTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (project) {
      setEditedProject({ ...project, tasks: tasks || [] });
    }
  }, [project, tasks]);

  useEffect(() => {
    const taskParam = searchParams.get('task');
    const tabParam = searchParams.get('tab');
    if (taskParam && tabParam === 'tasks' && mainContentRef.current && !isLoading) {
      setTimeout(() => {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams, isLoading, project]);

  useEffect(() => {
    if (!isLoading && !error && !project) {
      toast.error("Project not found or you do not have access.");
      navigate("/projects");
    }
    if (error) {
      toast.error("Failed to load project", { description: "Please check the URL or try again later." });
      navigate("/projects");
    }
  }, [isLoading, error, project, navigate]);

  useEffect(() => {
    if (editingTask && project?.tasks) {
      const updatedTask = project.tasks.find(t => t.id === editingTask.id);
      if (updatedTask) {
        setEditingTask(updatedTask);
      }
    }
  }, [project?.tasks, editingTask?.id]);

  const canEdit = user && (user.id === project?.created_by.id || user.role === 'admin' || user.role === 'master admin');

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = () => {
    if (!editedProject) return;
    mutations.updateProject.mutate(editedProject, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancelChanges = () => {
    setEditedProject(project ? { ...project, tasks: tasks || [] } : null);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    if (!editedProject) return;
    const newStatus = project?.status === 'Completed' ? 'In Progress' : 'Completed';
    mutations.updateProject.mutate({ ...editedProject, status: newStatus });
  };

  const handleDeleteProject = () => {
    if (!project) return;
    mutations.deleteProject.mutate(project.id);
    setIsDeleteDialogOpen(false);
  };

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

  const handleToggleCommentReaction = (commentId: string, emoji: string) => {
    mutations.toggleCommentReaction.mutate({ commentId, emoji });
  };

  if (authLoading || isLoading || isLoadingTasks || !project || !editedProject) {
    return <ProjectDetailSkeleton />;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader
          project={editedProject}
          isEditing={isEditing}
          isSaving={mutations.updateProject.isPending}
          canEdit={canEdit}
          onEditToggle={() => setIsEditing(true)}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          onToggleComplete={handleToggleComplete}
          onDeleteProject={() => setIsDeleteDialogOpen(true)}
          onFieldChange={handleFieldChange}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <ProjectDetailsCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <div ref={mainContentRef}>
              <ProjectMainContent
                project={editedProject}
                isEditing={isEditing}
                onFieldChange={handleFieldChange}
                mutations={mutations}
                defaultTab={defaultTab}
                onAddTask={handleCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleTaskCompletion={handleToggleTaskCompletion}
                onToggleCommentReaction={handleToggleCommentReaction}
              />
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard project={editedProject} />
            <ProjectTeamCard
              project={editedProject}
            />
          </div>
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </PortalLayout>
  );
};

export default ProjectDetail;