import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, AssignedUser } from "@/data/projects";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectOverview from "@/components/project-detail/ProjectOverview";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject({
        ...foundProject,
        tasks: foundProject.tasks || [],
      });
    }
  }, [projectId]);

  const handleProjectUpdate = (updatedData: Partial<Project>) => {
    if (!project) return;
    const updatedProject = { ...project, ...updatedData };
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    if (!project) return;

    const completedTasks = updatedTasks.filter(task => task.completed).length;
    const totalTasks = updatedTasks.length;
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    handleProjectUpdate({ tasks: updatedTasks, progress: newProgress });
  };

  if (!project) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-3 space-y-4">
          <ProjectOverview
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => handleProjectUpdate({ description: value })}
            onTeamChange={(team) => handleProjectUpdate({ assignedTo: team })}
            onFilesChange={(files) => handleProjectUpdate({ briefFiles: files })}
          />
          <ProjectProgressCard project={project} onTasksUpdate={handleTasksUpdate} />
        </div>
        <div className="lg:col-span-1">
          <ProjectSidebar project={project} />
        </div>
      </div>
    </main>
  );
};

export default ProjectDetail;