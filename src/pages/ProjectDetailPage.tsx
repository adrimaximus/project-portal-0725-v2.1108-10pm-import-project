import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dummyProjects } from "@/data/projects";

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = dummyProjects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The project you are looking for does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>Details for project ID: {project.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{project.description}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailPage;