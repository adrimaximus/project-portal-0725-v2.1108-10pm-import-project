import { Project, AssignedUser } from '@/types';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectBrief from './ProjectBrief';
import ProjectTags from './ProjectTags';
import { Tag } from '@/types';
import { toast } from 'sonner';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Generating project brief with AI...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-brief', {
        body: {
          title: project.name,
          startDate: project.start_date,
          dueDate: project.due_date,
          venue: project.venue,
          services: project.services,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.brief) {
        onDescriptionChange(data.brief);
        toast.success('Project brief generated successfully!', { id: toastId });
      } else {
        throw new Error('Failed to generate brief. The AI did not return any content.');
      }
    } catch (error: any) {
      console.error('Error generating brief:', error);
      toast.error(error.message || 'An unexpected error occurred.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Description & Brief</CardTitle></CardHeader>
        <CardContent>
          <ProjectDescription
            description={project.description}
            isEditing={isEditing}
            onDescriptionChange={onDescriptionChange}
            aiOptions={{
              onGenerate: handleGenerateBrief,
              isGenerating: isGenerating,
              prompt: 'Generate with AI from project details'
            }}
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