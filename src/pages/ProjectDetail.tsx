import { useState, useEffect, useRef } from "react";
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
import { Project } from "@/types";

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading, error } = useProject(slug!);
  const mutations = useProjectMutations(slug!);

  const defaultTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

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

  if (authLoading || isLoading || !project || !editedProject) {
    return <ProjectDetailSkeleton />;
  }

  const canEdit = user && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

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
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
    if (editedProject) {
      mutations.updateProject.mutate({ ...editedProject, status: newStatus });
    }
  };

  const handleDeleteProject = () => {
    mutations.deleteProject.mutate(project.id);
    setIsDeleteDialogOpen(false);
  };

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
              />
            </div>
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