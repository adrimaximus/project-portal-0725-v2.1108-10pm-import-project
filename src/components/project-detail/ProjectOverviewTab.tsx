import { Project, AssignedUser } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectBrief from './ProjectBrief';
import { Input } from '../ui/input';
import { getInitials } from '@/lib/utils';
import ProjectTags from './ProjectTags';
import { Tag } from '@/types';

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
  onServicesChange: (services: string[]) => void;
  onTagsChange: (tags: Tag[]) => void;
}

const ProjectOverviewTab = ({ 
  project, 
  isEditing, 
  onDescriptionChange, 
  onFilesAdd, 
  onFileDelete,
  onTagsChange
}: ProjectOverviewTabProps) => {
  
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

      <Card>
        <CardHeader><CardTitle>Project Tags</CardTitle></CardHeader>
        <CardContent>
          <ProjectTags
            project={project}
            isEditing={isEditing}
            onTagsChange={onTagsChange}
          />
        </CardContent>
      </Card>

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