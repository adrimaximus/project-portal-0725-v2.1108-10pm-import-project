import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionProps {
  project: Project;
  isEditing: boolean;
  editedDescription: string;
  onDescriptionChange: (value: string) => void;
}

const ProjectDescription = ({ project, isEditing, editedDescription, onDescriptionChange }: ProjectDescriptionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={8}
            className="text-base"
          />
        ) : (
          <div
            className="prose max-w-none prose-p:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDescription;