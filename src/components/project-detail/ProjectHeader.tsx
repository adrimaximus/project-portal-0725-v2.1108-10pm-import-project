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
  canEdit: boolean;
}

const ProjectHeader = ({
  project,
  isEditing,
  projectName,
  onProjectNameChange,
  onEditToggle,
  onSaveChanges,
  onCancelChanges,
  canEdit,
}: ProjectHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background -mx-4 md:-mx-8 px-4 md:px-8 pb-4 -mt-4 md:-mt-8">
      <div className="pt-4 md:pt-8">
        <Button variant="ghost" asChild className="-ml-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <Input
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="text-2xl font-bold h-auto p-0 border-0 focus-visible:ring-0 bg-transparent"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          )}
          <Badge className={getStatusClass(project.status)}>{project.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            isEditing ? (
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
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default ProjectHeader;