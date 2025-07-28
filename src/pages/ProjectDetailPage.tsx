import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, AssignedUser, Comment } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectOverviewTab from "@/components/project-detail/ProjectOverviewTab";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectComments from "@/components/project-detail/ProjectComments";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      const projectCopy = JSON.parse(JSON.stringify(foundProject));
      setProject(projectCopy);
      setEditedProject(projectCopy);
    } else {
      // Handle project not found
    }
  }, [projectId]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
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
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
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

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <ProjectOverviewTab
                project={editedProject}
                isEditing={isEditing}
                onDescriptionChange={handleDescriptionChange}
                onTeamChange={handleTeamChange}
                onFilesChange={handleFilesChange}
              />
            </TabsContent>
          </Tabs>
          
          <ProjectComments 
            comments={project.comments || []}
            onCommentPost={handleCommentPost}
            onTicketCreate={handleCreateTicket}
          />

        </div>
        <div className="md:col-span-1 lg:col-span-1">
          <ProjectProgressCard project={project} onTasksUpdate={handleTasksUpdate} />
        </div>
      </div>
    </main>
  );
};

export default ProjectDetailPage;