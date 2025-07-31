import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { dummyProjects, Project, AssignedUser, Task, ProjectFile } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { Comment } from "@/components/ProjectComments";
import { initialComments } from "@/data/comments";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find(p => p.id === projectId);
    if (foundProject) {
      const projectComments = initialComments.filter(c => c.projectId === projectId);
      const projectWithData = {
        ...foundProject,
        tasks: foundProject.tasks || [],
        comments: projectComments,
      };
      setProject(projectWithData);
      setEditedProject(structuredClone(projectWithData));
    } else {
      navigate('/');
    }
  }, [projectId, navigate]);

  if (!project || !editedProject) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading project...</p>
        </div>
      </PortalLayout>
    );
  }

  const handleSaveChanges = () => {
    const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1 && editedProject) {
      dummyProjects[projectIndex] = editedProject;
      setProject(editedProject);
    }
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    if (project) {
      setEditedProject(structuredClone(project));
    }
    setIsEditing(false);
  };

  const handleProjectNameChange = (name: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, name });
    }
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value as any });
    }
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject) {
      const originalDate = (project as any)[name];
      const dateString = date ? format(date, 'yyyy-MM-dd') : originalDate;
      setEditedProject({ ...editedProject, [name]: dateString });
    }
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, budget: value || 0 });
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
  
  const handleFilesChange = (newFiles: File[]) => {
    if (editedProject) {
      const newProjectFiles: ProjectFile[] = newFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }));
      const existingFiles = editedProject.briefFiles || [];
      setEditedProject({ ...editedProject, briefFiles: [...existingFiles, ...newProjectFiles] });
    }
  };

  const handleServicesChange = (services: string[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, services });
    }
  };

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    if (editedProject) {
      const completedTasks = updatedTasks.filter(task => task.completed).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setEditedProject({
        ...editedProject,
        tasks: updatedTasks,
        progress: newProgress,
      });
    }
  };

  const handleAddCommentOrTicket = (newComment: Comment) => {
    setEditedProject(currentEditedProject => {
      if (!currentEditedProject) return null;

      const updatedProject = { ...currentEditedProject };
      updatedProject.comments = [...(currentEditedProject.comments || []), newComment];

      if (newComment.isTicket) {
        const mentionRegex = /@([a-zA-Z0-9\s._-]+)/g;
        const mentionedNames = [...newComment.text.matchAll(mentionRegex)].map(match => match[1].trim());
        const usersToAssign = updatedProject.assignedTo.filter(user => mentionedNames.includes(user.name));
        const newTask: Task = {
          id: `task-${Date.now()}`,
          text: newComment.text.replace(mentionRegex, '').replace(/\s\s+/g, ' ').trim(),
          completed: false,
          assignedTo: usersToAssign.map(user => user.id),
        };
        updatedProject.tasks = [...(currentEditedProject.tasks || []), newTask];
      }

      if (!isEditing) {
        setProject(updatedProject);
        const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          dummyProjects[projectIndex] = updatedProject;
        }
      }
      
      return updatedProject;
    });
  };

  const ticketCount = editedProject.comments?.filter(c => c.isTicket).length || 0;

  return (
    <PortalLayout>
      <div className="h-full overflow-y-auto space-y-6 p-4 lg:p-6">
        <ProjectHeader 
          project={project} 
          isEditing={isEditing}
          projectName={editedProject.name}
          onProjectNameChange={handleProjectNameChange}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProjectInfoCards 
              project={project}
              isEditing={isEditing}
              editedProject={editedProject}
              onSelectChange={handleSelectChange}
              onDateChange={handleDateChange}
              onBudgetChange={handleBudgetChange}
            />
            <ProjectMainContent
              project={editedProject}
              isEditing={isEditing}
              onDescriptionChange={handleDescriptionChange}
              onTeamChange={handleTeamChange}
              onFilesChange={handleFilesChange}
              onServicesChange={handleServicesChange}
              onAddCommentOrTicket={handleAddCommentOrTicket}
              projectId={project.id}
              ticketCount={ticketCount}
              allProjects={dummyProjects}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard 
              project={editedProject}
              onTasksUpdate={handleTasksUpdate}
            />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;