import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectProvider, useProjectContext } from "@/contexts/ProjectContext";
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
import { toast } from "sonner";

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

const ProjectDetailContent = () => {
  const { handleDeleteProject } = useProjectContext();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader onDeleteProject={() => setIsDeleteDialogOpen(true)} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <ProjectDetailsCard />
            <ProjectMainContent />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard />
            <ProjectTeamCard />
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

const ProjectDetail = () => {
  const { loading: authLoading } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isLoading, error, data } = useProject(slug!);

  useEffect(() => {
    if (!isLoading && !error && !data) {
      toast.error("Project not found or you do not have access.");
      navigate("/projects");
    }
    if (error) {
      toast.error("Failed to load project", { description: "Please check the URL or try again later." });
      navigate("/projects");
    }
  }, [isLoading, error, data, navigate]);

  if (authLoading || isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <ProjectProvider>
      <ProjectDetailContent />
    </ProjectProvider>
  );
};

export default ProjectDetail;