import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, AssignedUser, ProjectStatus, PaymentStatus, ProjectFile, User } from "@/types";
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

    const [membersRes, tasksRes, commentsRes, filesRes, servicesRes] = await Promise.all([
      supabase.from('project_members').select('user_id, role').eq('project_id', projectId),
      supabase.from('tasks').select('*, task_assignees(user_id)').eq('project_id', projectId),
      supabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('project_files').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('project_services').select('service_title').eq('project_id', projectId)
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
    filesRes.data?.forEach(f => {
      if (f.user_id) userIds.add(f.user_id)
    });

    const { data: profilesData } = await supabase.from('profiles').select('*').in('id', Array.from(userIds));
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const mapProfileToUser = (id: string): User | null => {
      const profile = profilesMap.get(id);
      if (!profile) return null;
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        email: profile.email,
        avatar_url: profile.avatar_url,
        initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
        first_name: profile.first_name,
        last_name: profile.last_name,
      };
    };

    const assignedTo: AssignedUser[] = (membersRes.data?.map(m => ({ ...mapProfileToUser(m.user_id), role: m.role })).filter(u => u && u.id) as AssignedUser[]) || [];
    const tasks: Task[] = tasksRes.data?.map((t: any) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      originTicketId: t.origin_ticket_id,
      assignedTo: t.task_assignees.map((a: any) => mapProfileToUser(a.user_id)).filter(Boolean) as User[],
    })) || [];
    const comments: Comment[] = commentsRes.data?.map((c: any) => ({
      id: c.id,
      text: c.text,
      timestamp: c.created_at,
      is_ticket: c.is_ticket,
      attachment: c.attachment_url ? { name: c.attachment_name, url: c.attachment_url, type: 'file' as const } : undefined,
      author: mapProfileToUser(c.author_id) as User,
    })).filter(c => c.author) || [];
    
    const briefFiles: ProjectFile[] = filesRes.data?.map((f: any) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.url,
      storagePath: f.storage_path,
      uploadedAt: f.created_at,
    })) || [];

    const services: string[] = servicesRes.data?.map(s => s.service_title) || [];

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
      paymentDueDate: projectData.payment_due_date,
      createdBy: projectData.created_by ? mapProfileToUser(projectData.created_by) : null,
      assignedTo,
      tasks,
      comments,
      activities: [],
      briefFiles,
      services,
    };

    setProject(fullProject);
    setEditedProject(JSON.parse(JSON.stringify(fullProject)));
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser && projectId) {
      fetchProjectDetails();
    }
  }, [projectId, navigate, currentUser]);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editedProject || !project || !projectId) return;

    const { name, description, status, budget, startDate, dueDate, paymentStatus, paymentDueDate, services, assignedTo } = editedProject;

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({
        name, description, status, budget,
        start_date: startDate,
        due_date: dueDate,
        payment_status: paymentStatus,
        payment_due_date: paymentDueDate,
      })
      .eq('id', projectId);

    if (projectUpdateError) {
      toast.error("Failed to save project details.");
      console.error("Error updating project:", projectUpdateError);
      return;
    }

    const originalMemberIds = new Set(project.assignedTo.map(m => m.id));
    const newMemberIds = new Set(assignedTo.map(m => m.id));
    const membersToAdd = assignedTo.filter(m => !originalMemberIds.has(m.id));
    const membersToRemove = project.assignedTo.filter(m => !newMemberIds.has(m.id));

    if (membersToRemove.length > 0) {
      const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).in('user_id', membersToRemove.map(m => m.id));
      if (error) console.error("Error removing members:", error);
    }
    if (membersToAdd.length > 0) {
      const { error } = await supabase.from('project_members').insert(membersToAdd.map(m => ({ project_id: projectId, user_id: m.id, role: 'member' })));
      if (error) console.error("Error adding members:", error);
    }

    const originalServiceTitles = new Set(project.services || []);
    const newServiceTitles = new Set(editedProject.services || []);
    const servicesToAdd = (editedProject.services || []).filter(s => !originalServiceTitles.has(s));
    const servicesToRemove = (project.services || []).filter(s => !newServiceTitles.has(s));

    if (servicesToRemove.length > 0) {
      await supabase.from('project_services').delete().eq('project_id', projectId).in('service_title', servicesToRemove);
    }
    if (servicesToAdd.length > 0) {
      await supabase.from('project_services').insert(servicesToAdd.map(title => ({ project_id: projectId, service_title: title })));
    }
    
    await fetchProjectDetails();
    toast.success("Project updated successfully!");
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    setEditedProject(JSON.parse(JSON.stringify(project)));
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
    } else {
      toast.success("Task added.");
      await fetchProjectDetails();
    }
  };

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const { error } = await supabase.from('tasks').update({ completed }).eq('id', taskId);
    if (error) {
      toast.error("Failed to update task status.");
    } else {
      await fetchProjectDetails();
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast.error("Failed to delete task.");
    } else {
      toast.success("Task deleted.");
      await fetchProjectDetails();
    }
  };

  const handleAssignUsersToTask = async (taskId: string, userIds: string[]) => {
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    if (userIds.length > 0) {
      const newAssignees = userIds.map(user_id => ({ task_id: taskId, user_id }));
      await supabase.from('task_assignees').insert(newAssignees);
    }
    toast.success("Task assignees updated.");
    await fetchProjectDetails();
  };

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachment: File | null) => {
    if (!projectId || !currentUser) return;
    let attachment_url: string | null = null, attachment_name: string | null = null;
    if (attachment) {
      const filePath = `${projectId}/${Date.now()}-${attachment.name}`;
      const { error } = await supabase.storage.from('project-files').upload(filePath, attachment);
      if (error) { toast.error('Failed to upload attachment.'); return; }
      attachment_url = supabase.storage.from('project-files').getPublicUrl(filePath).data.publicUrl;
      attachment_name = attachment.name;
    }
    const { data: newComment, error } = await supabase.from('comments').insert({ project_id: projectId, author_id: currentUser.id, text, is_ticket: isTicket, attachment_url, attachment_name }).select().single();
    if (error) { toast.error('Failed to add comment.'); return; }
    if (isTicket && newComment) {
      await supabase.from('tasks').insert({ project_id: projectId, title: text, created_by: currentUser.id, origin_ticket_id: newComment.id });
    }
    toast.success(isTicket ? 'Ticket created.' : 'Comment added.');
    await fetchProjectDetails();
  };

  const handleFilesAdd = async (files: File[]) => {
    if (!projectId || !currentUser) return;
    toast.info(`Uploading ${files.length} file(s)...`);
    for (const file of files) {
      const filePath = `${projectId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
      if (uploadError) { toast.error(`Failed to upload ${file.name}.`); continue; }
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
      await supabase.from('project_files').insert({ project_id: projectId, user_id: currentUser.id, name: file.name, size: file.size, type: file.type, url: urlData.publicUrl, storage_path: filePath });
    }
    toast.success("File upload process finished.");
    await fetchProjectDetails();
  };

  const handleFileDelete = async (fileId: string) => {
    if (!project) return;
    const fileToDelete = project.briefFiles?.find(f => f.id === fileId);
    if (!fileToDelete) return;
    const { error: storageError } = await supabase.storage.from('project-files').remove([fileToDelete.storagePath]);
    if (storageError) { toast.error("Failed to delete file from storage."); return; }
    const { error: dbError } = await supabase.from('project_files').delete().eq('id', fileId);
    if (dbError) { toast.error("File deleted from storage, but failed to delete record."); return; }
    toast.success("File deleted successfully.");
    await fetchProjectDetails();
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
          canEdit={true}
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
            onFilesAdd={handleFilesAdd}
            onFileDelete={handleFileDelete}
            onTaskAdd={handleAddTask}
            onTaskAssignUsers={handleAssignUsersToTask}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
            onAddCommentOrTicket={handleAddCommentOrTicket}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <ProjectSidebar project={projectToDisplay} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;