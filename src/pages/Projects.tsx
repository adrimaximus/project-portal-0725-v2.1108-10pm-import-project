import PortalLayout from "@/components/PortalLayout";
import { ProjectsTable } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Projects = () => {
  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Here is a list of all your projects.
          </p>
        </div>
        <Button asChild>
          <Link to="/request">
            <PlusCircle className="mr-2 h-4 w-4" />
            Request Project
          </Link>
        </Button>
      </div>
      <ProjectsTable projects={dummyProjects} />
    </PortalLayout>
  );
};

export default Projects;