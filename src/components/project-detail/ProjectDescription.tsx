import RichTextEditor from '@/components/RichTextEditor';

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
    <div className="bg-stone-50 dark:bg-stone-900 p-6 sm:p-8 rounded-lg">
      <div className="prose dark:prose-invert max-w-none">
        {description ? (
          <div dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <p className="text-muted-foreground">No description provided.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDescription;