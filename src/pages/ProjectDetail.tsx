import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, User, Activity, ActivityType, ProjectFile, ProjectStatus, PaymentStatus } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { useProjects } from "@/contexts/ProjectContext";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import { toast } from "sonner";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { getProjectById, updateProject } = useProjects();

  const project = useMemo(() => {
    if (!projectId) return null;
    return getProjectById(projectId);
  }, [projectId, getProjectById]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!project && projectId) {
      // This might happen if the user navigates to a non-existent project ID
      navigate("/");
    }
  }, [project, projectId, navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProject(null);
    } else {
      setEditedProject(project);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (editedProject && projectId) {
      updateProject(projectId, editedProject);
      toast.success("Project updated successfully!");
    }
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleProjectNameChange = (newName: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, name: newName });
    }
  };

  const handleCardSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value as ProjectStatus | PaymentStatus });
    }
  };

  const handleCardDateChange = (name: 'dueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject && date) {
      setEditedProject({ ...editedProject, [name]: date.toISOString() });
    }
  };

  const handleCardBudgetChange = (value: number | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, budget: value });
    }
  };

  const createActivity = useCallback((type: ActivityType, details: any): Activity => {
    return {
      id: `act-${Date.now()}`,
      user: currentUser,
      type,
      details,
      timestamp: new Date().toISOString(),
    };
  }, [currentUser]);

  const handleUpdateProjectDetails = (updatedDetails: Partial<Project>) => {
    if (!project || !projectId) return;
    
    let activity: Activity | undefined;

    if (updatedDetails.status && updatedDetails.status !== project.status) {
        activity = createActivity('PROJECT_STATUS_UPDATED', { description: `updated project status to "${updatedDetails.status}".` });
    } else if (updatedDetails.paymentStatus && updatedDetails.paymentStatus !== project.paymentStatus) {
        activity = createActivity('PAYMENT_STATUS_UPDATED', { description: `updated payment status to "${updatedDetails.paymentStatus}".` });
    } else if (updatedDetails.dueDate && updatedDetails.dueDate !== project.dueDate) {
        const oldDate = new Date(project.dueDate).toLocaleDateString();
        const newDate = new Date(updatedDetails.dueDate).toLocaleDateString();
        activity = createActivity('PROJECT_DETAILS_UPDATED', { description: `changed due date from ${oldDate} to ${newDate}.` });
    } else if (updatedDetails.budget && updatedDetails.budget !== project.budget) {
        activity = createActivity('PROJECT_DETAILS_UPDATED', { description: `updated budget from $${project.budget} to $${updatedDetails.budget}.` });
    }

    const finalUpdates = activity 
      ? { ...updatedDetails, activities: [activity, ...(project.activities || [])] }
      : updatedDetails;

    updateProject(projectId, finalUpdates);
    toast.success("Project details updated.");
  };

  const handleUpdateTeam = (newMemberName: string) => {
    if (!project || !projectId) return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newMemberName,
      initials: newMemberName.split(' ').map(n => n[0]).join('').toUpperCase(),
      email: `${newMemberName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
      role: 'Member',
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    const updatedTeam = [...project.assignedTo, newUser];
    const activity = createActivity('TEAM_MEMBER_ADDED', { description: `added ${newMemberName} to the team.` });
    
    updateProject(projectId, { assignedTo: updatedTeam, activities: [activity, ...(project.activities || [])] });
    toast.success(`${newMemberName} has been added to the project.`);
  };
  
  const handleFileUpload = (files: File[]) => {
    if (!project || !projectId) return;
    const newFiles: ProjectFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));
    
    const updatedFiles = [...(project.briefFiles || []), ...newFiles];
    const activity = createActivity('FILE_UPLOADED', { description: `uploaded ${files.length} new file(s).` });
    
    updateProject(projectId, { briefFiles: updatedFiles, activities: [activity, ...(project.activities || [])] });
    toast.success(`${files.length} file(s) uploaded successfully.`);
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    if (!project || !projectId) return;
    updateProject(projectId, { tasks });
  };

  const handleTaskStatusChange = (taskId: string, completed: boolean) => {
    if (!project || !project.tasks || !projectId) return;
    let activity: Activity | null = null;
    const updatedTasks = project.tasks.map((task) => {
      if (task.id === taskId) {
        if (completed && !task.completed) {
          activity = createActivity('TASK_COMPLETED', { description: `completed task "${task.title}".` });
        } else if (!completed && task.completed) {
          activity = createActivity('TASK_REOPENED', { description: `re-opened task "${task.title}".` });
        }
        return { ...task, completed };
      }
      return task;
    });

    const finalUpdates: Partial<Project> = { tasks: updatedTasks };
    if (activity) {
      finalUpdates.activities = [activity, ...(project.activities || [])];
    }
    updateProject(projectId, finalUpdates);
  };

  const handleTaskDelete = (taskId: string) => {
    if (!project || !project.tasks || !projectId) return;
    const taskToDelete = project.tasks.find(t => t.id === taskId);
    const updatedTasks = project.tasks.filter((task) => task.id !== taskId);
    
    const finalUpdates: Partial<Project> = { tasks: updatedTasks };
    if (taskToDelete) {
      const activity = createActivity('TASK_DELETED', { description: `deleted task "${taskToDelete.title}".` });
      finalUpdates.activities = [activity, ...(project.activities || [])];
    }
    updateProject(projectId, finalUpdates);
  };

  const handleAddCommentOrTicket = (item: Comment) => {
    if (!project || !projectId) return;
    const updatedComments = [...(project.comments || []), item];
    
    let activity: Activity;
    if (item.isTicket) {
      activity = createActivity('TICKET_CREATED', { description: `created a ticket: "${item.text}"` });
      toast.success("New ticket created.");
    } else {
      activity = createActivity('COMMENT_ADDED', { description: `commented on the project.` });
    }
    
    updateProject(projectId, { comments: updatedComments, activities: [activity, ...(project.activities || [])] });
  };

  if (!project) {
    return <PortalLayout><div>Loading...</div></PortalLayout>;
  }

  return (
    <PortalLayout
      pageHeader={
        <ProjectHeader 
          project={project} 
          isEditing={isEditing}
          projectName={isEditing && editedProject ? editedProject.name : project.name}
          onProjectNameChange={handleProjectNameChange}
          onEditToggle={handleEditToggle}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          canEdit={true}
        />
      }
      noPadding
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-6">
        <div className="lg:col-span-2 space-y-8">
          <ProjectInfoCards
            project={project}
            isEditing={isEditing}
            editedProject={editedProject}
            onSelectChange={handleCardSelectChange}
            onDateChange={handleCardDateChange}
            onBudgetChange={handleCardBudgetChange}
          />
          <ProjectMainContent
            project={project}
            onUpdateTasks={handleUpdateTasks}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
            onAddCommentOrTicket={handleAddCommentOrTicket}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <ProjectSidebar
            project={project}
            onUpdateProject={handleUpdateProjectDetails}
            onUpdateTeam={handleUpdateTeam}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;