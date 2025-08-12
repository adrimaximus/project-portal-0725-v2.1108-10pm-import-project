import PortalLayout from "@/components/PortalLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ProjectsPage = () => {
  return (
    <PortalLayout>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild>
            <Link to="/request/new">New Project</Link>
        </Button>
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;