import PortalLayout from "@/components/PortalLayout";
import { useParams } from "react-router-dom";

const ProjectDetailPage = () => {
  const { slug } = useParams();
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Project Detail: {slug}</h1>
      <p>Details for the project will be displayed here.</p>
    </PortalLayout>
  );
};

export default ProjectDetailPage;