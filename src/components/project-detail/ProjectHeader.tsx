import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { getStatusClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.category}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <Badge variant="outline" className={cn("border-transparent text-sm", getStatusClass(project.status))}>
            {project.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};