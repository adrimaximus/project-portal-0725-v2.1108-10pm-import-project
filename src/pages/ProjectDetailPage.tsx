import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task } from "@/data/projects";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCard from "@/components/project-detail/ProjectInfoCard";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectTeamCard from "@/components/project-detail/ProjectTeamCard";
import ProjectActivityFeed from "@/components/project-detail/ProjectActivityFeed";
import ProjectDetailsTabs from "@/components/project-detail/ProjectDetailsTabs";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProject, setEditableProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      setEditableProject(JSON.parse(JSON.stringify(foundProject))); // Deep copy for editing
    } else {
      navigate("/404");
    }
  }, [projectId, navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (project) {
      // Reset changes if canceling
      setEditableProject(JSON.parse(JSON.stringify(project)));
    }
  };

  const handleSaveChanges = () => {
    if (editableProject) {
      // Find the index of the project in the main array
      const projectIndex = dummyProjects.findIndex(p => p.id === editableProject.id);
      if (projectIndex !== -1) {
        // Update the main array
        dummyProjects[projectIndex] = editableProject;
      }
      // Update the state
      setProject(editableProject);
      setIsEditing(false);
    }
  };

  const handleProjectNameChange = (name: string) => {
    if (editableProject) {
      setEditableProject({ ...editableProject, name });
    }
  };

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    if (editableProject) {
      const completedTasks = updatedTasks.filter(task => task.completed).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setEditableProject({ 
        ...editableProject, 
        tasks: updatedTasks,
        progress: newProgress,
      });
    }
  };

  if (!project || !editableProject) {
    return <div>Loading project...</div>;
  }

  const projectData = isEditing ? editableProject : project;

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 space-y-6 overflow-y-auto p-4 lg:p-6">
        <ProjectHeader
          project={projectData}
          isEditing={isEditing}
          projectName={editableProject.name}
          onProjectNameChange={handleProjectNameChange}
          onEditToggle={handleEditToggle}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleEditToggle} // Cancel is the same as toggling off
        />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <ProjectInfoCard project={projectData} />
            <ProjectDetailsTabs project={projectData} isEditing={isEditing} onTasksUpdate={handleTasksUpdate} />
          </div>
          <div className="space-y-6 md:col-span-1">
            <ProjectProgressCard project={projectData} onTasksUpdate={isEditing ? handleTasksUpdate : undefined} />
            <ProjectTeamCard project={projectData} />
            <ProjectActivityFeed activities={projectData.activityFeed || []} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailPage;