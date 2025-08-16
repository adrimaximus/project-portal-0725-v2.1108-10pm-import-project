import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { ProjectAiAssistant } from "@/components/ProjectAiAssistant";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Projects = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch } = useProjects();
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Projects</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAiAssistantOpen(true)} size={isMobile ? "icon" : "default"}>
            <Sparkles className={cn(!isMobile && "mr-2", "h-4 w-4")} />
            <span className={cn(isMobile && "sr-only")}>Ask AI</span>
          </Button>
          <Button onClick={() => navigate('/request')} size={isMobile ? "icon" : "default"}>
            <PlusCircle className={cn(!isMobile && "mr-2", "h-4 w-4")} />
            <span className={cn(isMobile && "sr-only")}>New Project</span>
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