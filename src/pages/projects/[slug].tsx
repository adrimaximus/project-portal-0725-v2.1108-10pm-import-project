import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProjectBySlug } from '@/lib/projectsApi';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Task, UpsertTaskPayload, Project, ProjectStatus, Reaction, Comment as CommentType } from '@/types';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useProjectMutations } from '@/hooks/useProjectMutations';
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
import PortalLayout from '@/components/PortalLayout';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectDetailsCard from '@/components/project-detail/ProjectDetailsCard';
import ProjectProgressCard from '@/components/project-detail/ProjectProgressCard';
import ProjectTeamCard from '@/components/project-detail/ProjectTeamCard';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';
import SafeLocalStorage from '@/lib/localStorage';

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const { unreadTaskIds } = useUnreadTasks();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const highlightedCommentId = searchParams.get('comment');

  const onCommentHighlightComplete = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('comment');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: project, isLoading, error } = useQuery<Project | null>({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!isLoading && !project) {
      toast.error("Project not found or you don't have permission to view it.");
      navigate('/projects', { replace: true });
    }
  }, [isLoading, project, navigate]);

  const storageKey = useMemo(() => project ? `project-description-draft-${project.id}` : null, [project]);

  const { 
    updateProject, 
    addFiles, 
    deleteFile, 
    deleteProject, 
    updateProjectStatus,
  } = useProjectMutations(slug);
  
  const { 
    deleteTask, 
    toggleTaskCompletion, 
  } = useTaskMutations(() => queryClient.invalidateQueries({ queryKey: ['project', slug] }));

  useEffect(() => {
    if (project) {
      const channel = supabase
        .channel(`project-updates-${project.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `project_id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_activities', filter: `project_id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_files', filter: `project_id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${project.id}` }, () => queryClient.invalidateQueries({ queryKey: ['project', slug] }))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [project, slug, queryClient]);

  const canEdit = hasPermission('projects:edit') || hasPermission('projects:edit_all');

  const enterEditMode = () => {
    if (project) {
      const draft = storageKey ? SafeLocalStorage.getItem<string>(storageKey) : null;
      const description = draft !== null ? draft : project.description;
      setEditedProject({ ...project, description });
      setIsEditing(true);
      setHasChanges(draft !== null);
    }
  };

  useEffect(() => {
    if (isEditing && editedProject && storageKey) {
      SafeLocalStorage.setItem(storageKey, editedProject.description || '');
    }
  }, [isEditing, editedProject?.description, storageKey]);

  const handleCancelChanges = () => {
    setIsEditing(false);
    setEditedProject(null);
    setHasChanges(false);
    if (storageKey) SafeLocalStorage.removeItem(storageKey);
  };

  const handleSaveChanges = useCallback(() => {
    if (editedProject) {
      updateProject.mutate(editedProject, {
        onSuccess: (data: Project) => {
          setIsEditing(false);
          setEditedProject(null);
          setHasChanges(false);
          if (storageKey) SafeLocalStorage.removeItem(storageKey);
          if (slug && slug !== data.slug) {
            toast.success("Project updated successfully! Redirecting...");
            navigate(`/projects/${data.slug}`, { replace: true });
          } else {
            toast.success("Project saved successfully!");
          }
        },
      });
    } else {
      setIsEditing(false);
    }
  }, [editedProject, updateProject, slug, navigate, storageKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        if (isEditing) {
          event.preventDefault();
          handleSaveChanges();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, handleSaveChanges]);

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
      setHasChanges(true);
    }
  };

  const handleToggleComplete = () => {
    if (project) {
      const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
      updateProjectStatus.mutate({ projectId: project.id, status: newStatus });
    }
  };

  const confirmDeleteTask = () => { if (taskToDelete) { deleteTask(taskToDelete.id); setTaskToDelete(null); } };
  const handleToggleTaskCompletion = (task: Task, completed: boolean) => toggleTaskCompletion({ task, completed });

  if (isLoading || !project) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const projectToDisplay = isEditing && editedProject ? editedProject : project;
  const hasOpenTasks = project.tasks?.some(task => !task.completed) ?? false;

  return (
    <>
      <PortalLayout>
        <div className="space-y-6">
          <ProjectHeader
            project={projectToDisplay}
            isEditing={isEditing}
            isSaving={updateProject.isPending}
            canEdit={canEdit}
            onEditToggle={enterEditMode}
            onSaveChanges={handleSaveChanges}
            onCancelChanges={handleCancelChanges}
            onToggleComplete={handleToggleComplete}
            onDeleteProject={() => setIsDeleteDialogOpen(true)}
            onFieldChange={handleFieldChange}
            onStatusChange={(newStatus) => updateProjectStatus.mutate({ projectId: project.id, status: newStatus })}
            hasOpenTasks={hasOpenTasks}
            hasChanges={hasChanges}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <ProjectDetailsCard
                project={projectToDisplay}
                isEditing={isEditing}
                onFieldChange={handleFieldChange}
                onStatusChange={(newStatus) => updateProjectStatus.mutate({ projectId: project.id, status: newStatus })}
                hasOpenTasks={hasOpenTasks}
              />
              <ProjectMainContent
                project={projectToDisplay}
                isEditing={isEditing}
                onFieldChange={handleFieldChange}
                mutations={{ addFiles, deleteFile }}
                defaultTab={searchParams.get('tab') || 'overview'}
                onEditTask={(task) => onOpenTaskModal(task, undefined, project)}
                onDeleteTask={setTaskToDelete}
                onToggleTaskCompletion={handleToggleTaskCompletion}
                highlightedTaskId={searchParams.get('task')}
                onHighlightComplete={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('task');
                  setSearchParams(newParams, { replace: true });
                }}
                highlightedCommentId={highlightedCommentId}
                onCommentHighlightComplete={onCommentHighlightComplete}
                onSetIsEditing={() => enterEditMode()}
                isUploading={addFiles.isPending}
                onSaveChanges={handleSaveChanges}
                onOpenTaskModal={onOpenTaskModal}
                unreadTaskIds={unreadTaskIds}
              />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <ProjectProgressCard project={project} />
              <ProjectTeamCard project={project} />
            </div>
          </div>
        </div>
      </PortalLayout>
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the task "{taskToDelete?.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the project "{project.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteProject.mutate(project.id)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectDetailPage;