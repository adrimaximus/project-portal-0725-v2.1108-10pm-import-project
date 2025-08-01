import { Project } from '@/data/projects';
import { Badge } from '@/components/ui/badge';
import { getStatusClass } from '@/lib/utils';
import { Button } from '../ui/button';

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
}

const ProjectHeader = ({ project, projectName }: ProjectHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{projectName}</h1>
      <div className="flex items-center gap-4">
        <Badge className={getStatusClass(project.status)}>{project.status}</Badge>
        <Button>Edit</Button>
      </div>
    </div>
  );
};

export default ProjectHeader;