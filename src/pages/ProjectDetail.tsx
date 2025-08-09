import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, AssignedUser, ProjectStatus, PaymentStatus } from "@/data/projects";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    setIsLoading(true);

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      console.error("Error fetching project details:", projectError);
      toast.error('Project not found.');
      navigate('/projects');
      return;
    }

    const [membersRes, tasksRes, commentsRes] = await Promise.all([
      supabase.from('project_members').select('user_id, role').eq('project_id', projectId),
      supabase.from('tasks').select('*, task_assignees(user_id)').eq('project_id', projectId),
      supabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    ]);

    const userIds = new Set<string>();
    if (projectData.created_by) userIds.add(projectData.created_by);
    membersRes.data?.forEach(m => userIds.add(m.user_id));
    tasksRes.data?.forEach(t => {
      if (t.created_by) userIds.add(t.created_by);
      (t.task_assignees as any[]).forEach(a => userIds.add(a.user_id));
    });
    commentsRes.data?.forEach(c => {
      if (c.author_id) userIds.add(c.author_id)
    });

    const { data: profilesData } = await supabase.from('profiles').select('*').in('id', Array.from(userIds));
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const mapProfileToUser = (id: string): AssignedUser | null => {
      const profile = profilesMap.get(id);
      if (!profile) return null;
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        email: profile.email,
        avatar: profile.avatar_url,
        initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
        first_name: profile.first_name,
        last_name: profile.last_name,
      };
    };

    const assignedTo: AssignedUser[] = (membersRes.data?.map(m => ({ ...mapProfileToUser(m.user_id), role: m.role })).filter(Boolean) as AssignedUser[]) || [];
    const tasks: Task[] = tasksRes.data?.map((t: any) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      originTicketId: t.origin_ticket_id,
      assignedTo: t.task_assignees.map((a: any) => mapProfileToUser(a.user_id)).filter(Boolean) as AssignedUser[],
    })) || [];
    const comments: Comment[] = commentsRes.data?.map((c: any) => ({
      id: c.id,
      text: c.text,
      timestamp: c.created_at,
      isTicket: c.is_ticket,
      attachment: c.attachment_url ? { name: c.attachment_name, url: c.attachment_url } : undefined,
      author: mapProfileToUser(c.author_id) as AssignedUser,
    })).filter(c => c.author) || [];

    const fullProject: Project = {
      id: projectData.id,
      name: projectData.name,
      category: projectData.category,
      description: projectData.description,
      status: projectData.status as ProjectStatus,
      progress: projectData.progress,
      budget: projectData.budget,
      startDate: projectData.start_date,
      dueDate: projectData.due_date,
      paymentStatus: projectData.payment_status as PaymentStatus,
      createdBy: projectData.created_by ? mapProfileToUser(projectData.created_by) : null,
      assignedTo,
      tasks,
      comments,
      activities: [],
      briefFiles: [],
      services: projectData.services,
    };

    setProject(fullProject);
    setEditedProject(fullProject); // Also initialize editedProject
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser && projectId) {
      fetchProjectDetails();
    }
  }, [projectId, navigate, currentUser]);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedProject(project); // Reset changes when entering edit mode
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editedProject || !projectId) return;

    const { name, description, status, budget, startDate, dueDate, paymentStatus, services, assignedTo } = editedProject;

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({
        name, description, status, budget,
        start_date: startDate,
        due_date: dueDate,
        payment_status: paymentStatus,
        services,
      })
      .eq('id', projectId);

    if (projectUpdateError) {
      toast.error("Failed to save project details.");
      console.error("Error updating project:", projectUpdateError);
      return;
    }
    
    // Simple refresh after saving
    await fetchProjectDetails();
    toast.success("Project updated successfully!");
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    setEditedProject(project); // Discard changes
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [field]: value });
    }
  };

  const handleAddTask = async (title: string) => {
    if (!projectId || !currentUser) return;
    const { error } = await supabase
      .from('tasks')
      .insert({ project_id: projectId, title: title, created_by: currentUser.id });

    if (error) {
      toast.error("Failed to add task.");
      console.error("Error adding task:", error);
    } else {
      toast.success("Task added.");
      await fetchProjectDetails(); // Refresh data
    }
  };

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', taskId);

    if (error) {
      toast.error("Failed to update task status.");
      console.error("Error updating task status:", error);
    } else {
      // Optimistic update
      const updater = (p: Project | null) => {
        if (!p) return null;
        return {
          ...p,
          tasks: p.tasks?.map(t => t.id === taskId ? { ...t, completed } : t)
        };
      };
      setProject(updater);
      setEditedProject(updater);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast.error("Failed to delete task.");
      console.error("Error deleting task:", error);
    } else {
      toast.success("Task deleted.");
      await fetchProjectDetails(); // Refresh data
    }
  };

  const handleAssignUsersToTask = async (taskId: string, userIds: string[]) => {
    const { error: deleteError } = await supabase.from('task_assignees').delete().eq('task_id', taskId);
    if (deleteError) {
      toast.error("Failed to update assignees.");
      console.error("Error clearing assignees:", deleteError);
      return;
    }

    if (userIds.length > 0) {
      const newAssignees = userIds.map(user_id => ({ task_id: taskId, user_id }));
      const { error: insertError } = await supabase.from('task_assignees').insert(newAssignees);
      if (insertError) {
        toast.error("Failed to add new assignees.");
        console.error("Error inserting assignees:", insertError);
        return;
      }
    }
    toast.success("Task assignees updated.");
    await fetchProjectDetails(); // Refresh data
  };

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachment: File | null) => {
    if (!projectId || !currentUser) return;

    let attachment_url: string | null = null;
    let attachment_name: string | null = null;

    if (attachment) {
      const filePath = `${projectId}/${Date.now()}-${attachment.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, attachment);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Failed to upload attachment.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);
      
      attachment_url = urlData.publicUrl;
      attachment_name = attachment.name;
    }

    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        project_id: projectId,
        author_id: currentUser.id,
        text,
        is_ticket: isTicket,
        attachment_url,
        attachment_name,
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error adding comment:', commentError);
      toast.error('Failed to add comment.');
      return;
    }

    if (isTicket && newComment) {
      const { error: taskError } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: text,
        created_by: currentUser.id,
        origin_ticket_id: newComment.id,
      });

      if (taskError) {
        console.error('Error creating task from ticket:', taskError);
        toast.error('Comment was added, but failed to create a corresponding ticket.');
      }
    }

    toast.success(isTicket ? 'Ticket created successfully.' : 'Comment added successfully.');
    await fetchProjectDetails();
  };

  const showNotImplementedToast = () => {
    toast.info("This feature is not yet connected to the database.");
  };

  if (isLoading || !project) {
    return <PortalLayout><div>Loading project details...</div></PortalLayout>;
  }

  const projectToDisplay = isEditing && editedProject ? editedProject : project;

  return (
    <PortalLayout
      pageHeader={
        <ProjectHeader 
          project={project} 
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          canEdit={true} // TODO: Add role-based logic
        />
      }
      noPadding
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-6">
        <div className="lg:col-span-2 space-y-8">
          <ProjectInfoCards
            project={projectToDisplay}
            isEditing={isEditing}
            editedProject={editedProject}
            onSelectChange={(name, value) => handleFieldChange(name, value)}
            onDateChange={(name, date) => handleFieldChange(name, date?.toISOString())}
            onBudgetChange={(value) => handleFieldChange('budget', value)}
          />
          <ProjectMainContent
            project={projectToDisplay}
            isEditing={isEditing}
            onDescriptionChange={(value) => handleFieldChange('description', value)}
            onTeamChange={(users) => handleFieldChange('assignedTo', users)}
            onServicesChange={(services) => handleFieldChange('services', services)}
            onFilesChange={showNotImplementedToast} // Placeholder
            onTaskAdd={handleAddTask}
            onTaskAssignUsers={handleAssignUsersToTask}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
            onAddCommentOrTicket={handleAddCommentOrTicket}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <ProjectSidebar
            project={projectToDisplay}
            onUpdateProject={showNotImplementedToast}
            onUpdateTeam={showNotImplementedToast}
            onFileUpload={showNotImplementedToast}
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;