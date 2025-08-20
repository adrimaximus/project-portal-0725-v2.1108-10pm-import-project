import { Project, AssignedUser } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectBrief from './ProjectBrief';
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

const ProjectOverviewTab = ({ project, isEditing, onDescriptionChange, onCategoryChange, onFilesAdd, onFileDelete }: ProjectOverviewTabProps) => {
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
  
  const showCategoryCard = project.category !== 'Requested Event' && project.category !== 'Imported Event';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Description & Brief</CardTitle></CardHeader>
        <CardContent>
          <ProjectDescription
            description={project.description}
            isEditing={isEditing}
            onDescriptionChange={onDescriptionChange}
          />
        </CardContent>
      </Card>

      {showCategoryCard && (
        <Card>
          <CardHeader><CardTitle>Category</CardTitle></CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={project.category || ''}
                onChange={(e) => onCategoryChange(e.target.value)}
                placeholder="Enter project category"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{project.category || "No category set."}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Shared Files</CardTitle></CardHeader>
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