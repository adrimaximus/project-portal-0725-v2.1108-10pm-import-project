import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectsPageHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-6 flex-shrink-0">
      <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
      <div className="flex items-center gap-2">
        <Button onClick={() => navigate('/request')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectsPageHeader;