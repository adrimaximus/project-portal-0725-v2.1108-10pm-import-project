import PortalLayout from "@/components/PortalLayout";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Project Details</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project: {slug}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for project "{slug}" will be displayed here.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default ProjectPage;