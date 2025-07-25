import PortalLayout from "@/components/PortalLayout";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
        <Button onClick={() => navigate('/request')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <ProjectsTable columns={columns} data={dummyProjects} />
    </PortalLayout>
  );
};

export default Projects;