import { Project } from "@/data/projects";
import ProjectComments from "../ProjectComments";
import ProjectDescription from "./ProjectDescription";
import ProjectHeader from "./ProjectHeader";
import ProjectTeam from "./ProjectTeam";
import { Separator } from "@/components/ui/separator";

interface ProjectMainContentProps {
  project: Project;
}

const ProjectMainContent = ({ 
  project, 
}: ProjectMainContentProps) => {
  return (
    <main className="flex-1 py-8 px-6">
      <ProjectHeader project={project} />
      <Separator className="my-6" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <ProjectDescription />
          <ProjectComments project={project} />
        </div>
        <div className="space-y-6">
          <ProjectTeam />
        </div>
      </div>
    </main>
  );
};

export default ProjectMainContent;