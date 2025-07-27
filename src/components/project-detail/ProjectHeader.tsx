import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pencil, Save, X } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
}

const ProjectHeader = ({ project, isEditing, onEditToggle, onSaveChanges, onCancelChanges }: ProjectHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-bold tracking-tight mt-2">{project.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancelChanges}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={onSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onEditToggle}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;