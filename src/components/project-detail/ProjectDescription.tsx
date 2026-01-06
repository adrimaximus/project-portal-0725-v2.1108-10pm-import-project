import RichTextEditor from '@/components/RichTextEditor';
import 'react-quill/dist/quill.snow.css';
import ProjectReports from './ProjectReports';

interface AIOptions {
  onGenerate: () => void;
  isGenerating: boolean;
  prompt: string;
}

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onSetIsEditing: (isEditing: boolean) => void;
  aiOptions?: AIOptions;
  projectId?: string; // Added optional projectId to support reports
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange, onSetIsEditing, aiOptions, projectId }: ProjectDescriptionProps) => {
  if (isEditing) {
    return (
      <RichTextEditor
        value={description || ''}
        onChange={onDescriptionChange}
        onGenerate={aiOptions?.onGenerate}
        isGenerating={aiOptions?.isGenerating}
        prompt={aiOptions?.prompt}
        placeholder="Describe the project goals, scope, and deliverables..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div 
        className="bg-muted/50 p-4 rounded-lg group cursor-pointer transition-colors hover:bg-muted min-h-[100px]"
        onClick={() => onSetIsEditing(true)}
      >
        {description ? (
          <div className="ql-snow !border-none">
            <div 
              className="ql-editor text-sm [&>*:first-child]:mt-0 [&_h1]:mt-6 max-h-[300px] overflow-y-auto !p-0" 
              dangerouslySetInnerHTML={{ __html: description }} 
            />
          </div>
        ) : (
          <div className="text-center flex items-center justify-center h-full">
            <p className="text-muted-foreground group-hover:text-foreground">Click to add a description.</p>
          </div>
        )}
      </div>

      {projectId && <ProjectReports projectId={projectId} />}
    </div>
  );
};

export default ProjectDescription;