import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { Project } from "@/types";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProjectForm from "@/components/projects/ProjectForm";
import GridView from "@/components/projects/GridView";
import ListView from "@/components/projects/ListView";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProjectsPage = () => {
  const { data: projects = [], isLoading } = useProjects();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { updateProject, deleteProject } = useProjectMutations(selectedProject?.id || '');

  const createProject = useMutation({
    mutationFn: async (projectData: Partial<Project>) => {
      const { data, error } = await supabase.from('projects').insert(projectData).select().single();
      if (error) throw new Error(error.message);
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleNewProject = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        toast.success("Project deleted successfully.");
      },
      onError: (error) => {
        toast.error("Failed to delete project.", { description: error.message });
      },
    });
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (selectedProject && selectedProject.id) {
      const projectToUpdate: Project = { ...selectedProject, ...projectData };
      updateProject.mutate(projectToUpdate, {
        onSuccess: () => {
          toast.success("Project updated successfully.");
          setIsFormOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to update project.", { description: error.message });
        },
      });
    } else {
      createProject.mutate(projectData, {
        onSuccess: () => {
          toast.success("Project created successfully.");
          setIsFormOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to create project.", { description: error.message });
        },
      });
    }
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage all your ongoing and completed projects.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as "grid" | "list");
            }}
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={handleNewProject}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div>
          {viewMode === "grid" ? (
            <GridView projects={projects} onEditProject={handleEditProject} onDeleteProject={handleDeleteProject} />
          ) : (
            <ListView projects={projects} onDeleteProject={handleDeleteProject} />
          )}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {selectedProject ? "Update the details of your project." : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSave={handleSaveProject}
            onCancel={() => setIsFormOpen(false)}
            initialData={selectedProject || { status: 'On Track', budget: 0, payment_status: 'Unpaid' }}
          />
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
};

export default ProjectsPage;