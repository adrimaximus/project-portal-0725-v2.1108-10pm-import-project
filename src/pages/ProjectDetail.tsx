import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { dummyProjects, Project, AssignedUser, Task, ProjectFile, Comment, Activity, ActivityType } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import { useUser } from "@/contexts/UserContext";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const canEdit = currentUser.role === 'Admin';

  useEffect(() => {
    const foundProject = dummyProjects.find(p => p.id === projectId);
    if (foundProject) {
      const projectWithData = {
        ...foundProject,
        tasks: foundProject.tasks || [],
        comments: foundProject.comments || [],
        activities: foundProject.activities || [],
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
    if (!editedProject || !project) return;

    let tempProject = { ...editedProject };
    let newActivities: Activity[] = [];

    const createActivity = (type: ActivityType, description: string): Activity => ({
      id: `activity-${Date.now()}-${Math.random()}`,
      type,
      timestamp: new Date().toISOString(),
      user: { id: currentUser.id, name: currentUser.name },
      details: { description }
    });

    if (editedProject.name !== project.name) {
      newActivities.push(createActivity('PROJECT_DETAILS_UPDATED', `memperbarui nama proyek menjadi '${editedProject.name}'`));
    }
    if (editedProject.status !== project.status) {
      newActivities.push(createActivity('PROJECT_STATUS_UPDATED', `mengubah status proyek dari '${project.status}' menjadi '${editedProject.status}'`));
    }
    if (editedProject.paymentStatus !== project.paymentStatus) {
      newActivities.push(createActivity('PAYMENT_STATUS_UPDATED', `mengubah status pembayaran dari '${project.paymentStatus}' menjadi '${editedProject.paymentStatus}'`));
    }
    if (editedProject.deadline !== project.deadline) {
      newActivities.push(createActivity('PROJECT_DETAILS_UPDATED', `memperbarui tanggal selesai menjadi ${format(new Date(editedProject.deadline), 'dd MMM yyyy')}`));
    }
    if (editedProject.budget !== project.budget) {
      newActivities.push(createActivity('PROJECT_DETAILS_UPDATED', `memperbarui anggaran proyek`));
    }
    if (editedProject.description !== project.description) {
      newActivities.push(createActivity('PROJECT_DETAILS_UPDATED', `memperbarui deskripsi proyek`));
    }

    const oldTeamIds = new Set(project.assignedTo.map(u => u.id));
    const newTeamIds = new Set(editedProject.assignedTo.map(u => u.id));
    editedProject.assignedTo.forEach(user => {
      if (!oldTeamIds.has(user.id)) {
        newActivities.push(createActivity('TEAM_MEMBER_ADDED', `menambahkan ${user.name} ke tim`));
      }
    });
    project.assignedTo.forEach(user => {
      if (!newTeamIds.has(user.id)) {
        newActivities.push(createActivity('TEAM_MEMBER_REMOVED', `menghapus ${user.name} dari tim`));
      }
    });

    const oldFiles = new Set(project.briefFiles?.map(f => f.name) || []);
    (editedProject.briefFiles || []).forEach(file => {
      if (!oldFiles.has(file.name)) {
        newActivities.push(createActivity('FILE_UPLOADED', `mengunggah file: '${file.name}'`));
      }
    });

    tempProject.activities = [...newActivities.reverse(), ...(tempProject.activities || [])];

    const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = tempProject;
    }
    setProject(tempProject);
    setEditedProject(structuredClone(tempProject));
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

  const handleDateChange = (name: 'deadline' | 'startDate', date: Date | undefined) => {
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
      const originalTasks = editedProject.tasks || [];
      let newActivities: Activity[] = [];

      const createActivity = (type: ActivityType, description: string): Activity => ({
        id: `activity-${Date.now()}-${Math.random()}`,
        type,
        timestamp: new Date().toISOString(),
        user: { id: currentUser.id, name: currentUser.name },
        details: { description }
      });

      updatedTasks.filter(ut => !originalTasks.some(ot => ot.id === ut.id))
        .forEach(task => newActivities.push(createActivity('TASK_CREATED', `membuat tugas baru: "${task.name}"`)));

      updatedTasks.filter(ut => ut.completed && !originalTasks.find(ot => ot.id === ut.id)?.completed)
        .forEach(task => newActivities.push(createActivity('TASK_COMPLETED', `menyelesaikan tugas: "${task.name}"`)));
      
      originalTasks.filter(ot => !updatedTasks.some(ut => ut.id === ot.id))
        .forEach(task => newActivities.push(createActivity('TASK_DELETED', `menghapus tugas: "${task.name}"`)));

      const completedTasks = updatedTasks.filter(task => task.completed).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setEditedProject({
        ...editedProject,
        tasks: updatedTasks,
        progress: newProgress,
        activities: [...newActivities, ...(editedProject.activities || [])],
      });
    }
  };

  const handleAddCommentOrTicket = (newComment: Comment) => {
    const activityType = newComment.isTicket ? 'TICKET_CREATED' : 'COMMENT_ADDED';
    const textPreview = newComment.text.replace(/@\[[^\]]+\]\(([^)]+)\)/g, '@$1').substring(0, 50);
    const activityDescription = newComment.isTicket 
      ? `membuat tiket baru: "${textPreview}${newComment.text.length > 50 ? '...' : ''}"`
      : `memberi komentar: "${textPreview}${newComment.text.length > 50 ? '...' : ''}"`;

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      type: activityType,
      timestamp: new Date().toISOString(),
      user: { id: newComment.author.id, name: newComment.author.name },
      details: { description: activityDescription }
    };

    setEditedProject(currentEditedProject => {
      if (!currentEditedProject) return null;
  
      let updatedProject = { ...currentEditedProject };
      updatedProject.comments = [...(currentEditedProject.comments || []), newComment];
      updatedProject.activities = [activity, ...(currentEditedProject.activities || [])];
  
      if (newComment.isTicket) {
        let newTaskText = newComment.text.trim();
        if (!newTaskText && newComment.attachment) {
          newTaskText = `Review attachment: ${newComment.attachment.name}`;
        }

        if (newTaskText) {
          const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
          let match;
          const mentionedUserIds = new Set<string>();
          while ((match = mentionRegex.exec(newComment.text)) !== null) {
            mentionedUserIds.add(match[1]);
          }

          const assignedTo = currentEditedProject.assignedTo.filter(user => mentionedUserIds.has(user.id));

          const newTask: Task = {
            id: `task-${Date.now()}`,
            name: newTaskText.replace(/@\[[^\]]+\]\(([^)]+)\)/g, '@$1'),
            completed: false,
            assignedTo: assignedTo,
            originTicketId: newComment.id,
          };
          updatedProject.tasks = [...(currentEditedProject.tasks || []), newTask];
          const currentTasks = updatedProject.tasks || [];
          const completedTasks = currentTasks.filter(task => task.completed).length;
          const totalTasks = currentTasks.length;
          updatedProject.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }
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

  const openTicketCount = editedProject.comments?.filter(comment => {
    if (!comment.isTicket) {
      return false;
    }
    const task = editedProject.tasks?.find(t => t.originTicketId === comment.id);
    return !task || !task.completed;
  }).length || 0;

  return (
    <PortalLayout
      pageHeader={
        <ProjectHeader 
          project={project} 
          isEditing={isEditing}
          projectName={editedProject.name}
          onProjectNameChange={handleProjectNameChange}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          canEdit={canEdit}
        />
      }
    >
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
            onTasksUpdate={handleTasksUpdate}
            ticketCount={openTicketCount}
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ProjectProgressCard 
            project={editedProject}
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;