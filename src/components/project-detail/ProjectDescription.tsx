import RichTextEditor from '@/components/RichTextEditor';

// Defines the complete set of expected properties for the AI feature
interface AIOptions {
  onGenerate: () => void;
  isGenerating: boolean;
  prompt: string;
  title: string;
  startDate?: string | Date;
  dueDate?: string | Date;
  venue?: string;
  services?: string[];
}

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  aiOptions?: AIOptions;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange, aiOptions }: ProjectDescriptionProps) => {
  // When in editing mode, display the RichTextEditor with the AI button enabled
  if (isEditing && aiOptions) {
    // Separate the AI handlers/state from the data payload
    const { onGenerate, isGenerating, prompt, ...dataOptions } = aiOptions;
    
    return (
      <RichTextEditor
        value={description || ''}
        onChange={onDescriptionChange}
        // Pass handlers and state as separate props
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        prompt={prompt}
        // Pass only the data payload in aiOptions
        aiOptions={dataOptions}
        placeholder="Describe the project goals, scope, and deliverables..."
      />
    );
  }

  // When not editing, display the formatted description
  return (
    <div className="prose dark:prose-invert max-w-none">
      {description ? (
        <div dangerouslySetInnerHTML={{ __html: description }} />
      ) : (
        <p className="text-muted-foreground">No description provided.</p>
      )}
    </div>
  );
};

export default ProjectDescription;