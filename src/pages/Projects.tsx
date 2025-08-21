import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";

const Projects = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch } = useProjects();

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/request')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      <ProjectsTable projects={projects} isLoading={isLoading} refetch={refetch} />
    </PortalLayout>
  );
};

export default Projects;