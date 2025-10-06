import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { useProject } from "@/hooks/useProject";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  Copy,
} from "lucide-react";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { toast } from "sonner";
import { Project, ProjectStatus } from "@/types";

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(slug);
  const mutations = useProjectMutations(project?.id);

  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (project) {
      mutations.updateProject.mutate({ ...project, status: newStatus });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="p-4 md:p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="md:col-span-2 lg:col-span-3 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !project) {
    return (
      <PortalLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">
            The project you are looking for does not exist or you do not have
            permission to view it.
          </p>
          <Button onClick={() => navigate("/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const isArchived = project.status === "Archived";

  return (
    <PortalLayout>
      <div className="flex items-center justify-between p-4 md:p-6 border-b">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleStatusChange(isArchived ? "On Track" : "Archived")}>
            {isArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
            {isArchived ? "Unarchive" : "Archive"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <ProjectHeader project={project} onStatusChange={handleStatusChange} />
        <div className="mt-6 grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ProjectMainContent project={project} />
          <ProjectSidebar project={project} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;