import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, User, File as ProjectFile, Service } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { ProjectHeader } from "@/components/project-detail/ProjectHeader";
import { ProjectInfoCards } from "@/components/project-detail/ProjectInfoCards";
import { ProjectMainContent } from "@/components/project-detail/ProjectMainContent";
import { ProjectSidebar } from "@/components/project-detail/ProjectSidebar";
import NotFound from "./NotFound";
import { useToast } from "@/components/ui/use-toast";

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | undefined>(undefined);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [projectId]);

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    // Here you would typically also update the master list or send to a server
  };

  const handleAddTask = (taskTitle: string) => {
    if (!project || !taskTitle) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      completed: false,
    };
    const updatedProject = { ...project, tasks: [...project.tasks, newTask] };
    setProject(updatedProject);
    toast({ title: "Task Added", description: `Task "${taskTitle}" has been added.` });
  };

  const handleToggleTask = (taskId: string) => {
    if (!project) return;
    const updatedTasks = project.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
  };

  const handleAssignUserToTask = (taskId: string, user: User) => {
    if (!project) return;
    const updatedTasks = project.tasks.map((task) => {
      if (task.id === taskId) {
        const isAssigned = task.assignedTo?.some(u => u.id === user.id);
        const newAssignedTo = isAssigned
          ? task.assignedTo?.filter(u => u.id !== user.id)
          : [...(task.assignedTo || []), user];
        return { ...task, assignedTo: newAssignedTo };
      }
      return task;
    });
    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
  };

  const handleUpdateBudget = (newBudgetString: string) => {
    if (!project) return;
    const newBudget = parseFloat(newBudgetString.replace(/[^0-9]/g, ''));
    if (!isNaN(newBudget)) {
      setProject({ ...project, value: newBudget, budget: newBudget });
      toast({ title: "Project Value Updated" });
    } else {
      toast({ title: "Invalid Input", description: "Please enter a valid number for the budget.", variant: "destructive" });
    }
  };

  const handleUpdateStatus = (newStatus: Project['status']) => {
    if (!project) return;
    setProject({ ...project, status: newStatus });
    toast({ title: "Project Status Updated" });
  };

  const handleAddFile = (file: File) => {
    if (!project) return;
    const newFile: ProjectFile = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        url: '#' // Placeholder
    }
    setProject({ ...project, briefFiles: [...project.briefFiles, newFile] });
  };

  const handleAddService = (service: Service) => {
    if (!project) return;
    setProject({ ...project, services: [...project.services, service] });
  };

  const handleUpdateTeam = (team: User[]) => {
    if (!project) return;
    setProject({ ...project, assignedTo: team });
  };

  const handleDeleteProject = () => {
    if (!project) return;
    // Logic to delete the project from the main list would go here
    toast({ title: "Project Deleted", description: `Project "${project.name}" has been deleted.` });
    navigate("/projects");
  };

  if (!project) {
    return <NotFound />;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader project={project} onStatusChange={handleUpdateStatus} />
        <ProjectInfoCards project={project} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProjectMainContent
            project={project}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onAssignUserToTask={handleAssignUserToTask}
          />
          <ProjectSidebar
            project={project}
            onUpdateBudget={handleUpdateBudget}
            onAddFile={handleAddFile}
            onAddService={handleAddService}
            onUpdateTeam={handleUpdateTeam}
            onDeleteProject={handleDeleteProject}
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetailPage;