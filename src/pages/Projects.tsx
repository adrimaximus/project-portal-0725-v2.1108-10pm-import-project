import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectList from "@/components/projects/ProjectList";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const Projects = () => {
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
      <ProjectList projects={projects} />
    </PortalLayout>
  );
};

export default Projects;