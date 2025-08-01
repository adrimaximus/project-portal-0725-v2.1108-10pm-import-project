import ProjectsTable from "@/components/ProjectsTable";
import { projects } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";

const Projects = () => {
  return (
    <PortalLayout>
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                <p className="text-muted-foreground">
                    Here's a list of all your projects.
                </p>
            </div>
            <ProjectsTable projects={projects} />
        </div>
    </PortalLayout>
  );
};

export default Projects;