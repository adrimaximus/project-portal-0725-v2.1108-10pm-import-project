import { Project } from "@/types";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectBrief from './ProjectBrief';
import ProjectTags from './ProjectTags';
import { Tag } from '@/types';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
  onServicesChange: (services: string[]) => void;
  onTagsChange: (tags: Tag[]) => void;
  onSetIsEditing?: (isEditing: boolean) => void;
}

const ProjectOverviewTab = ({ 
  project, 
  isEditing, 
  onDescriptionChange, 
  onFilesAdd, 
  onFileDelete,
  onTagsChange,
  onSetIsEditing
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
      <Card className="relative">
        <CardHeader className="p-4 pb-2">
          <CardTitle>Description & Brief</CardTitle>
        </CardHeader>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onSetIsEditing && onSetIsEditing(true)}
            disabled={!onSetIsEditing}
            className="absolute top-4 right-4 z-10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        <CardContent className="p-4 pt-0">
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
          <Separator className="my-4" />
          <div>
            <h3 className="text-base font-semibold mb-2">Project Tags</h3>
            <ProjectTags
              project={project}
              isEditing={isEditing}
              onTagsChange={onTagsChange}
            />
          </div>
          <Separator className="my-4" />
          <div>
            <h3 className="text-base font-semibold mb-2">Project Files</h3>
            <ProjectBrief
              files={project.briefFiles || []}
              isEditing={isEditing}
              onFilesAdd={onFilesAdd}
              onFileDelete={onFileDelete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;