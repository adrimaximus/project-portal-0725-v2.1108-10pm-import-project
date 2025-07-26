import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ProjectsDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projects Dashboard</h1>
        <Button onClick={() => navigate('/request')}>New Request</Button>
      </div>
      <ProjectsTable columns={columns} data={dummyProjects} />
    </div>
  );
};

export default ProjectsDashboard;