import { Project } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectInfoCardProps {
  project: Project;
}

const ProjectInfoCard = ({ project }: ProjectInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="whitespace-pre-wrap">{project.description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default ProjectInfoCard;