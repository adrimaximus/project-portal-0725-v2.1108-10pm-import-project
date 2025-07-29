import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { dummyProjects, Project, AssignedUser } from "@/data/projects";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverviewTab from "@/components/project-detail/ProjectOverviewTab";
import ProjectActivityTab from "@/components/project-detail/ProjectActivityTab";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | undefined>(
    dummyProjects.find((p) => p.id === projectId)
  );
  const [isEditing, setIsEditing] = useState(false);

  if (!project) {
    return <NotFound />;
  }

  const handleUpdateProject = (updatedFields: Partial<Project>) => {
    if (project) {
      const updatedProject = { ...project, ...updatedFields };
      setProject(updatedProject);
      // In a real app, you'd update the project in your backend/global state.
      // For now, we just update the local state.
      const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = updatedProject;
      }
    }
  };

  return (
    <PortalLayout>
      <ProjectHeader
        project={project}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSaveChanges={() => setIsEditing(false)}
        onDelete={() => {
          // Logic to delete project
          navigate("/");
        }}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="activity">Aktivitas & Peringkat</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ProjectOverviewTab
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => handleUpdateProject({ description: value })}
            onTeamChange={(users: AssignedUser[]) => handleUpdateProject({ assignedTo: users })}
            onFilesChange={(files: File[]) => handleUpdateProject({ briefFiles: files as any })}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ProjectActivityTab project={project} />
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
}