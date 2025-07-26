import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent } from "react";
import { Pencil, Save, X } from "lucide-react";

interface ProjectDetailHeaderProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function ProjectDetailHeader({
  project,
  isEditing,
  editedProject,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
}: ProjectDetailHeaderProps) {
  return (
    <div className="mb-6">
      {isEditing ? (
        <div className="space-y-4">
          <Input
            name="name"
            value={editedProject.name}
            onChange={onInputChange}
            className="text-3xl font-bold tracking-tight h-auto p-0 border-0 focus-visible:ring-0"
          />
          <Textarea
            name="description"
            value={editedProject.description}
            onChange={onInputChange}
            placeholder="Project description"
            className="text-lg text-muted-foreground mt-2 border-0 p-0 focus-visible:ring-0"
          />
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={onSave} size="sm">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-prose">
                {project.description}
              </p>
            </div>
            <Button onClick={onEdit} variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Project</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}