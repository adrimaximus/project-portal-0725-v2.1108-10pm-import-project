import PortalLayout from "@/components/PortalLayout";
import { useParams } from "react-router-dom";

const ProjectDetailPage = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Project Detail: {id}</h1>
      <p className="text-muted-foreground">This is where details for the selected project will be shown.</p>
    </PortalLayout>
  );
};

export default ProjectDetailPage;