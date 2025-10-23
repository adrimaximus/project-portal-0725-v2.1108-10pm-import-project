import RichTextEditor from '@/components/RichTextEditor';
import 'react-quill/dist/quill.snow.css';

interface AIOptions {
  onGenerate: () => void;
  isGenerating: boolean;
  prompt: string;
}

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  aiOptions?: AIOptions;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange, aiOptions }: ProjectDescriptionProps) => {
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
    <div className="bg-[#f6f7f3] dark:bg-stone-900 p-4 rounded-lg">
      {description ? (
        <div className="ql-snow !border-none">
          <div 
            className="ql-editor text-sm [&>*:first-child]:mt-0 max-h-[300px] overflow-y-auto !p-0" 
            dangerouslySetInnerHTML={{ __html: description }} 
          />
        </div>
      ) : (
        <p className="text-muted-foreground">No description provided.</p>
      )}
    </div>
  );
};

export default ProjectDescription;