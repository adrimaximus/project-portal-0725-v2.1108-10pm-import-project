import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onFieldChange: (field: keyof Project, value: any) => void;
  isSaving: boolean;
}

const ProjectHeader = ({
  project,
  isEditing,
  onEditToggle,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
  isSaving,
}: ProjectHeaderProps) => {
  return (
    <div className="bg-card border-b p-4 md:p-6 sticky top-0 z-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-grow">
          {isEditing ? (
            <Input
              value={project.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="text-2xl font-bold h-auto p-0 border-0 focus-visible:ring-0"
            />
          ) : (
            <h1 className="text-2xl font-bold">{project.name}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(project.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onEditToggle}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;