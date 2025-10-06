import { Project } from "@/types";
import { format } from "date-fns";

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Description</h4>
        <p className="text-sm text-muted-foreground">{project.description || "No description provided."}</p>
      </div>
      <div>
        <h4 className="font-semibold">Timeline</h4>
        <p className="text-sm text-muted-foreground">
          {project.start_date ? format(new Date(project.start_date), "PPP") : "N/A"} - {project.due_date ? format(new Date(project.due_date), "PPP") : "N/A"}
        </p>
      </div>
      <div>
        <h4 className="font-semibold">Client</h4>
        <p>{typeof project.created_by === 'object' ? `${project.created_by?.name} (${project.created_by?.email})` : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ProjectOverview;