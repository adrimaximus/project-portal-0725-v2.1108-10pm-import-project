import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { ProjectAiAssistant } from "@/components/ProjectAiAssistant";

const Projects = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch } = useProjects();
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  return (
    <PortalLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="outline" onClick={() => setIsAiAssistantOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Ask AI
          </Button>
          <Button onClick={() => navigate('/request')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      <ProjectsTable projects={projects} isLoading={isLoading} refetch={refetch} />
      <ProjectAiAssistant 
        open={isAiAssistantOpen} 
        onOpenChange={setIsAiAssistantOpen} 
        projects={projects}
      />
    </PortalLayout>
  );
};

export default Projects;