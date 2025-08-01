import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/data/projects";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Projects = () => {
  const projects = getProjects();

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Here's a list of all your projects.
          </p>
        </div>
        <Button asChild>
          <Link to="/request-project">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <ProjectsTable projects={projects} />
      </div>
    </PortalLayout>
  );
};

export default Projects;