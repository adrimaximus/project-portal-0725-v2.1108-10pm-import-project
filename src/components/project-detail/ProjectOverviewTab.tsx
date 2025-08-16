import { Project, AssignedUser } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectServices from './ProjectServices';
import ProjectBrief from './ProjectBrief';
import ModernTeamSelector from '../request/ModernTeamSelector';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
  onServicesChange: (services: string[]) => void;
}

const ProjectOverviewTab = ({ project, isEditing, onDescriptionChange, onCategoryChange, onTeamChange, onFilesAdd, onFileDelete, onServicesChange }: ProjectOverviewTabProps) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setAllUsers(users);
      }
    };
    fetchUsers();
  }, []);
  
  const handleTeamSelectionToggle = (userToToggle: AssignedUser) => {
    const isSelected = project.assignedTo.some(u => u.id === userToToggle.id);
    const newTeam = isSelected
      ? project.assignedTo.filter(u => u.id !== userToToggle.id)
      : [...project.assignedTo, userToToggle];
    onTeamChange(newTeam);
  };

  const assignableUsers = project.createdBy
    ? allUsers.filter(u => u.id !== project.createdBy.id)
    : allUsers;

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
        <CardHeader><CardTitle>Category</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={project.category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="Enter project category"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{project.category || "No category set."}</p>
          )}
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
              {project.createdBy && (
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
              )}
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
            onFilesAdd={onFilesAdd}
            onFileDelete={onFileDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;