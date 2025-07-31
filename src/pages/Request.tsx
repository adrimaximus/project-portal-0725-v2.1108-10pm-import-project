import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { useNavigate } from "react-router-dom";
import { ProjectDetailsForm } from "@/components/request/ProjectDetailsForm";

const Request = () => {
  const navigate = useNavigate();

  const handleFormSubmit = (project: Project) => {
    // In a real app, you'd add the project to your state management
    console.log("New project requested:", project);
    navigate(`/projects/${project.id}`);
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Request a New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectDetailsForm onFormSubmit={handleFormSubmit} />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Request;