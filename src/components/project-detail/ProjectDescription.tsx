import React from 'react';
import { Project } from '@/data/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ProjectDescriptionProps {
  project: Project;
  isEditing: boolean;
  editedDescription: string;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription: React.FC<ProjectDescriptionProps> = ({ project, isEditing, editedDescription, onDescriptionChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={8}
            placeholder="Enter project description..."
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDescription;