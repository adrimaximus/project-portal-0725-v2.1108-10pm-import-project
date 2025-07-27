import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange }: ProjectDescriptionProps) => {
  return (
    <>
      {isEditing ? (
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[120px]"
          placeholder="Enter project description..."
        />
      ) : (
        <p className="whitespace-pre-wrap min-h-[40px]">
          {description || "No description provided."}
        </p>
      )}
    </>
  );
};

export default ProjectDescription;