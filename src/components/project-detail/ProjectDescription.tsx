import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ description, isEditing, onDescriptionChange }: ProjectDescriptionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[200px]"
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDescription;