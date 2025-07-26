import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

interface ProjectDetailHeaderProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ProjectDetailHeader = ({
  project,
  isEditing,
  editedProject,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
}: ProjectDetailHeaderProps) => {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-grow">
        {isEditing && editedProject ? (
          <div className="space-y-2">
            <Label htmlFor="name" className="sr-only">Project Name</Label>
            <Input
              id="name"
              name="name"
              value={editedProject.name}
              onChange={onInputChange}
              className="text-3xl font-bold tracking-tight h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Project Name"
            />
            <Label htmlFor="description" className="sr-only">Project Description</Label>
            <Textarea
              id="description"
              name="description"
              value={editedProject.description}
              onChange={onInputChange}
              placeholder="Project description"
            />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={onSave}>Save</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        ) : (
          <Button onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Project
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailHeader;