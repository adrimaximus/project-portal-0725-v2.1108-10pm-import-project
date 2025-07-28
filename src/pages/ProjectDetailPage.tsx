import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, AssignedUser, Comment } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectOverview from "@/components/project-detail/ProjectOverview";
import ProjectComments from "@/components/project-detail/ProjectComments";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  // Helper to clone project state while preserving File objects
  const cloneProject = (p: Project | null): Project | null => {
    if (!p) return null;
    const cloned = JSON.parse(JSON.stringify(p));
    // Restore File objects that are lost during JSON serialization
    if (p.briefFiles) {
      cloned.briefFiles = p.briefFiles;
    }
    return cloned;
  };

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(cloneProject(foundProject));
      setEditedProject(cloneProject(foundProject));
    }
  }, [projectId]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleCancelChanges();
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (editedProject) {
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
      }
      setProject(editedProject);
      setIsEditing(false);
    }
  };

  const handleCancelChanges = () => {
    setEditedProject(cloneProject(project));
    setIsEditing(false);
  };

  const handleProjectNameChange = (name: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, name });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, description: value });
    }
  };

  const handleTeamChange = (selectedUsers: AssignedUser[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, assignedTo: selectedUsers });
    }
  };

  const handleFilesChange = (files: File[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, briefFiles: files });
    }
  };

  const handleTasksUpdate = (tasks: Task[]) => {
    if (editedProject) {
      const completedTasks = tasks.filter(task => task.completed).length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const updatedProject = { ...editedProject, tasks, progress };
      setEditedProject(updatedProject);
      setProject(updatedProject);
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = updatedProject;
      }
    }
  };

  const handleCommentPost = (newComment: Comment) => {
    if (editedProject) {
      const updatedComments = [...(editedProject.comments || []), newComment];
      const updatedProject = { ...editedProject, comments: updatedComments };
      setEditedProject(updatedProject);
      setProject(updatedProject);
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = updatedProject;
      }
    }
  };

  const handleCreateTicket = (taskText: string) => {
    if (editedProject) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        text: taskText,
        completed: false,
        assignedTo: [],
      };
      const updatedTasks = [...(editedProject.tasks || []), newTask];
      handleTasksUpdate(updatedTasks);
    }
  };

  if (!project || !editedProject) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> All Projects
        </Button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelChanges}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit className="mr-2 h-4 w-4" /> Edit Project
            </Button>
          )}
        </div>
      </div>

      <ProjectHeader
        project={project}
        isEditing={isEditing}
        editedName={editedProject.name}
        onNameChange={handleProjectNameChange}
      />

      <ProjectInfoCards project={project} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProjectOverview
            project={editedProject}
            isEditing={isEditing}
            onDescriptionChange={handleDescriptionChange}
            onTeamChange={handleTeamChange}
            onFilesChange={handleFilesChange}
            onTasksUpdate={handleTasksUpdate}
          />
          <ProjectComments
            projectId={project.id}
            comments={project.comments || []}
            onCommentPost={handleCommentPost}
            onTicketCreate={handleCreateTicket}
          />
        </div>
        <div className="lg:col-span-1">
          <ProjectSidebar project={project} />
        </div>
      </div>
    </main>
  );
};

export default ProjectDetailPage;