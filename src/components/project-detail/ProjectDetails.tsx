import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";

interface ProjectDetailsProps {
  project: Project;
  isEditing: boolean;
  editedDescription: string;
  onDescriptionChange: (value: string) => void;
}

const ProjectDetails = ({ project, isEditing, editedDescription, onDescriptionChange }: ProjectDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <RichTextEditor
            value={editedDescription}
            onChange={onDescriptionChange}
            placeholder="Describe your project goals, target audience, and key features..."
          />
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDetails;