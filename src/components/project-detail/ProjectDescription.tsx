import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange }: ProjectDescriptionProps) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Description</h3>
    {isEditing ? (
      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Enter project description..."
        className="min-h-[100px]"
      />
    ) : (
      <p className="text-muted-foreground">
        {description || "No description provided."}
      </p>
    )}
  </div>
);

export default ProjectDescription;