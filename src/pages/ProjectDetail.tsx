import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Tag, ProjectStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { useProject } from "@/hooks/useProject";
import { useProjectMutations } from "@/hooks/useProjectMutations";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: project, isLoading, error } = useProject(slug!);
  const mutations = useProjectMutations(slug!);

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error) {
    toast.error("Failed to load project", { description: "Please check the URL or try again later." });
    navigate("/projects");
    return null;
  }
  if (!project || !editedProject) return null;

  const canEdit = user && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (!editedProject) return;
    mutations.updateProject.mutate(editedProject, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const newStatus: ProjectStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
    mutations.updateProject.mutate({ ...editedProject, status: newStatus });
  };

  const handleDeleteProject = () => {
    mutations.deleteProject.mutate(project.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader
          project={editedProject}
          isEditing={isEditing}
          isSaving={mutations.updateProject.isPending}
          onEditToggle={() => setIsEditing(true)}
          onSaveChanges={handleSave}
          onCancelChanges={handleCancel}
          canEdit={canEdit}
          onFieldChange={handleFieldChange}
          onToggleComplete={handleToggleComplete}
          onDeleteProject={() => setIsDeleteDialogOpen(true)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <ProjectDetailsCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <ProjectMainContent
              project={editedProject}
              isEditing={isEditing}
              onDescriptionChange={(value) => handleFieldChange('description', value)}
              onTeamChange={(users) => handleFieldChange('assignedTo', users)}
              onFilesAdd={(files) => mutations.addFiles.mutate({ files, project, user: user! })}
              onFileDelete={(fileId) => {
                const file = project.briefFiles?.find(f => f.id === fileId);
                if (file) mutations.deleteFile.mutate(file);
              }}
              onServicesChange={(services) => handleFieldChange('services', services)}
              onTagsChange={(tags: Tag[]) => handleFieldChange('tags', tags)}
              onTaskAdd={(title) => mutations.addTask.mutate({ project, user: user!, title })}
              onTaskAssignUsers={(taskId, userIds) => mutations.assignUsersToTask.mutate({ taskId, userIds })}
              onTaskStatusChange={(taskId, completed) => mutations.updateTask.mutate({ taskId, updates: { completed } })}
              onTaskDelete={(taskId) => mutations.deleteTask.mutate(taskId)}
              onAddCommentOrTicket={(text, isTicket, attachment) => mutations.addComment.mutate({ project, user: user!, text, isTicket, attachment })}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard project={editedProject} />
            <ProjectTeamCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
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
    </PortalLayout>
  );
};

export default ProjectDetail;