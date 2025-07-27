import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange }: ProjectDescriptionProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {isEditing ? (
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[200px]"
            placeholder="Enter project description..."
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[200px]">
            {description || "No description provided."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDescription;