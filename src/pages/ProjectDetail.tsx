import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project, Task, Comment, User, Activity, ActivityType, ProjectFile, ProjectStatus, PaymentStatus } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { Layout, LayoutBody, LayoutHeader } from "@/components/custom/layout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import { toast } from "sonner";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    } else {
      navigate("/"); // Redirect if project not found
    }
  }, [projectId, navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProject(null);
    } else {
      setEditedProject(project);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (editedProject) {
      handleUpdateProjectDetails(editedProject);
      setProject(editedProject);
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

  const createActivity = (type: ActivityType, details: any): Activity => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser,
      type,
      details,
      timestamp: new Date().toISOString(),
    };
    return newActivity;
  };

  const addActivity = (activity: Activity) => {
    setProject(prev => prev ? { ...prev, activities: [activity, ...(prev.activities || [])] } : null);
  };

  const handleUpdateProjectDetails = (updatedDetails: Partial<Project>) => {
    if (!project) return;
    
    let activityDetails: { description: string, [key: string]: any } | null = null;

    if (updatedDetails.status && updatedDetails.status !== project.status) {
        activityDetails = { description: `updated project status to "${updatedDetails.status}".` };
        addActivity(createActivity('PROJECT_STATUS_UPDATED', activityDetails));
    } else if (updatedDetails.paymentStatus && updatedDetails.paymentStatus !== project.paymentStatus) {
        activityDetails = { description: `updated payment status to "${updatedDetails.paymentStatus}".` };
        addActivity(createActivity('PAYMENT_STATUS_UPDATED', activityDetails));
    } else if (updatedDetails.dueDate && updatedDetails.dueDate !== project.dueDate) {
        const oldDate = new Date(project.dueDate).toLocaleDateString();
        const newDate = new Date(updatedDetails.dueDate).toLocaleDateString();
        activityDetails = { description: `changed due date from ${oldDate} to ${newDate}.` };
        addActivity(createActivity('PROJECT_DETAILS_UPDATED', activityDetails));
    } else if (updatedDetails.budget && updatedDetails.budget !== project.budget) {
        activityDetails = { description: `updated budget from $${project.budget} to $${updatedDetails.budget}.` };
        addActivity(createActivity('PROJECT_DETAILS_UPDATED', activityDetails));
    }

    setProject((prev) => (prev ? { ...prev, ...updatedDetails } : null));
    toast.success("Project details updated.");
  };

  const handleUpdateTeam = (newMemberName: string) => {
    if (!project) return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newMemberName,
      initials: newMemberName.split(' ').map(n => n[0]).join('').toUpperCase(),
    };
    const updatedTeam = [...project.assignedTo, newUser];
    setProject({ ...project, assignedTo: updatedTeam });

    const activity = createActivity('TEAM_MEMBER_ADDED', { description: `added ${newMemberName} to the team.` });
    addActivity(activity);
    toast.success(`${newMemberName} has been added to the project.`);
  };
  
  const handleFileUpload = (files: File[]) => {
    if (!project) return;
    const newFiles: ProjectFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));
    
    const updatedFiles = [...(project.briefFiles || []), ...newFiles];
    setProject({ ...project, briefFiles: updatedFiles });

    const activity = createActivity('FILE_UPLOADED', { description: `uploaded ${files.length} new file(s).` });
    addActivity(activity);
    toast.success(`${files.length} file(s) uploaded successfully.`);
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    if (!project) return;
    setProject({ ...project, tasks });
  };

  const handleTaskStatusChange = (taskId: string, completed: boolean) => {
    if (!project || !project.tasks) return;
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
    setProject({ ...project, tasks: updatedTasks });
    if (activity) addActivity(activity);
  };

  const handleTaskDelete = (taskId: string) => {
    if (!project || !project.tasks) return;
    const taskToDelete = project.tasks.find(t => t.id === taskId);
    const updatedTasks = project.tasks.filter((task) => task.id !== taskId);
    setProject({ ...project, tasks: updatedTasks });
    if (taskToDelete) {
      const activity = createActivity('TASK_DELETED', { description: `deleted task "${taskToDelete.title}".` });
      addActivity(activity);
    }
  };

  const handleAddCommentOrTicket = (item: Comment) => {
    if (!project) return;
    const updatedComments = [...(project.comments || []), item];
    setProject({ ...project, comments: updatedComments });

    if (item.isTicket) {
      const activity = createActivity('TICKET_CREATED', { description: `created a ticket: "${item.text}"` });
      addActivity(activity);
      toast.success("New ticket created.");
    } else {
      const activity = createActivity('COMMENT_ADDED', { description: `commented on the project.` });
      addActivity(activity);
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <LayoutHeader>
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
      </LayoutHeader>
      <LayoutBody className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-6">
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
        <div className="lg:col-span-1">
          <ProjectSidebar
            project={project}
            onUpdateProject={handleUpdateProjectDetails}
            onUpdateTeam={handleUpdateTeam}
            onFileUpload={handleFileUpload}
          />
        </div>
      </LayoutBody>
    </Layout>
  );
};

export default ProjectDetail;