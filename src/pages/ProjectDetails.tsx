import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";

const ProjectDetails = () => {
  const { id } = useParams();

  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Showing details for project: {id}</p>
          <p>Full project detail view will be implemented here.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default ProjectDetails;