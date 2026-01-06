import { useState, useEffect } from 'react';
import { Project, Tag, Reaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ProjectDescription from './ProjectDescription';
import ProjectBrief from './ProjectBrief';
import ProjectTags from './ProjectTags';
import ProjectReportsList from './ProjectReportsList';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, BarChart3, Tag as TagIcon, Paperclip } from 'lucide-react';

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
  onServicesChange: (services: string[]) => void;
  onTagsChange: (tags: Tag[]) => void;
  onReactionsChange: (reactions: Reaction[]) => void;
  onSetIsEditing: (isEditing: boolean) => void;
  isUploading: boolean;
  onSaveChanges: () => void;
}

const ProjectOverviewTab = ({ 
  project, 
  isEditing, 
  onDescriptionChange, 
  onFilesAdd, 
  onFileDelete,
  onTagsChange,
  onReactionsChange,
  onSetIsEditing,
  isUploading,
  onSaveChanges,
}: ProjectOverviewTabProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditing && (event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        onSaveChanges();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, onSaveChanges]);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Main Column (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Project Description Card */}
        <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              <CardTitle className="text-lg">Project Brief</CardTitle>
            </div>
            <CardDescription>
              Comprehensive overview and goals for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectDescription
              description={project.description}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
              onSetIsEditing={onSetIsEditing}
              aiOptions={{
                onGenerate: handleGenerateBrief,
                isGenerating: isGenerating,
                prompt: 'Generate with AI'
              }}
            />
            <div className="mt-6">
              <ProjectBrief
                files={project.briefFiles || []}
                isEditing={isEditing}
                onFilesChange={onFilesAdd}
                onFileDelete={onFileDelete}
                onSetIsEditing={onSetIsEditing}
                isUploading={isUploading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports Card */}
        <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-5 h-5" />
              <CardTitle className="text-lg">Quick Reports</CardTitle>
            </div>
            <CardDescription>
              Recent updates, progress notes, and field reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectReportsList projectId={project.id} />
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar Column (1/3) */}
      <div className="space-y-6">
        {/* Tags & Reactions Card */}
        <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <TagIcon className="w-5 h-5" />
              <CardTitle className="text-lg">Tags & Reactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectTags
              project={project}
              isEditing={isEditing}
              onTagsChange={onTagsChange}
              onReactionsChange={onReactionsChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverviewTab;