import RichTextEditor from "@/components/RichTextEditor";

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange }: ProjectDescriptionProps) => {
  return (
    <>
      {isEditing ? (
        <RichTextEditor
          value={description}
          onChange={onDescriptionChange}
          placeholder="Enter project description..."
        />
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none min-h-[40px] text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: description || "No description provided." }}
        />
      )}
    </>
  );
};

export default ProjectDescription;