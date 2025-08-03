import { Project, AssignedUser } from '@/data/projects';
import { allUsers } from '@/data/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectServices from './ProjectServices';
import ProjectBrief from './ProjectBrief';
import ModernTeamSelector from '../request/ModernTeamSelector';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
}

const ProjectOverviewTab = ({ project, isEditing, onDescriptionChange, onTeamChange, onFilesChange, onServicesChange }: ProjectOverviewTabProps) => {
  
  const handleTeamSelectionToggle = (userToToggle: AssignedUser) => {
    const isSelected = project.assignedTo.some(u => u.id === userToToggle.id);
    const newTeam = isSelected
      ? project.assignedTo.filter(u => u.id !== userToToggle.id)
      : [...project.assignedTo, userToToggle];
    onTeamChange(newTeam);
  };

  const assignableUsers = allUsers.filter(u => u.id !== project.createdBy.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent>
          <ProjectDescription
            description={project.description}
            isEditing={isEditing}
            onDescriptionChange={onDescriptionChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Team</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
            <ModernTeamSelector
              users={assignableUsers}
              selectedUsers={project.assignedTo}
              onSelectionChange={handleTeamSelectionToggle}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={project.createdBy.avatar} />
                  <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{project.createdBy.name}</p>
                  <p className="text-xs text-muted-foreground">Project Owner</p>
                </div>
              </div>
              {project.assignedTo.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">Team Member</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Services</CardTitle></CardHeader>
        <CardContent>
          <ProjectServices
            selectedServices={project.services}
            isEditing={isEditing}
            onServicesChange={onServicesChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Brief & Files</CardTitle></CardHeader>
        <CardContent>
          <ProjectBrief
            files={project.briefFiles || []}
            isEditing={isEditing}
            onFilesChange={onFilesChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;