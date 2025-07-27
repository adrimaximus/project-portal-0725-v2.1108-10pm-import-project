import { Link } from "react-router-dom";
import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import { Input } from "../ui/input";
import { getStatusClass } from "@/lib/utils";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
}

const ProjectHeader = ({
  project,
  isEditing,
  projectName,
  onProjectNameChange,
  onEditToggle,
  onSaveChanges,
  onCancelChanges,
}: ProjectHeaderProps) => {
  return (
    <header className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" asChild className="-ml-4">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <Input
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="text-2xl font-bold h-auto p-0 border-0 focus-visible:ring-0"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          )}
          <Badge className={getStatusClass(project.status)}>{project.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={onSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={onCancelChanges}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onEditToggle}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProjectHeader;