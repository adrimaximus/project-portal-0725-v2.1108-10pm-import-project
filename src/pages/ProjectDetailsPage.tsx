import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for project with ID: {projectId}</p>
          {/* Full project details would be fetched and displayed here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailsPage;