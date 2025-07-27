import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, AssignedUser } from "@/data/projects";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectTeamCard from "@/components/project-detail/ProjectTeamCard";
import ProjectDetailsCard from "@/components/project-detail/ProjectDetailsCard";
import ProjectTasksCard from "@/components/project-detail/ProjectTasksCard";
import { initialComments } from "@/data/comments";
import { type Comment } from "@/components/ProjectComments";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isEditing, setIsEditing] = useState(false); // To satisfy ProjectMainContent props

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      const projectWithTasks = {
        ...foundProject,
        tasks: foundProject.tasks || [],
      };
      setProject(projectWithTasks);
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
    return (
      <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center">
        <p>Project not found.</p>
      </div>
    );
  }

  const projectComments = comments.filter(c => c.projectId === project.id);
  const ticketCount = projectComments.filter(c => c.isTicket).length;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          <ProjectMainContent
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => handleProjectUpdate({ description: value })}
            onTeamChange={(value) => handleProjectUpdate({ assignedTo: value as AssignedUser[] })}
            onFilesChange={(value) => handleProjectUpdate({ briefFiles: value })}
            comments={projectComments}
            setComments={setComments}
            projectId={project.id}
            ticketCount={ticketCount}
          />
          <ProjectTasksCard project={project} onTasksUpdate={handleTasksUpdate} />
        </div>
        <div className="space-y-4 md:space-y-8">
          <ProjectProgressCard project={project} />
          <ProjectTeamCard project={project} />
          <ProjectDetailsCard project={project} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;