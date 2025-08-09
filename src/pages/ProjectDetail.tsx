import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, User, Activity, ActivityType, ProjectFile, ProjectStatus, PaymentStatus, AssignedUser } from "@/data/projects";
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

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      setIsLoading(true);

      // 1. Fetch project data
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

      // 2. Fetch all related data in parallel
      const [membersRes, tasksRes, commentsRes] = await Promise.all([
        supabase.from('project_members').select('user_id, role').eq('project_id', projectId),
        supabase.from('tasks').select('*, task_assignees(user_id)').eq('project_id', projectId),
        supabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
      ]);

      // 3. Collect all unique user IDs from all related data
      const userIds = new Set<string>();
      if (projectData.created_by) userIds.add(projectData.created_by);
      membersRes.data?.forEach(m => userIds.add(m.user_id));
      tasksRes.data?.forEach(t => {
        if (t.created_by) userIds.add(t.created_by);
        t.task_assignees.forEach((a: any) => userIds.add(a.user_id));
      });
      commentsRes.data?.forEach(c => {
        if (c.author_id) userIds.add(c.author_id)
      });

      // 4. Fetch all user profiles in a single query
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

      // 5. Map all data together
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
        activities: [], // Placeholder - to be implemented
        briefFiles: [], // Placeholder - to be implemented
        services: projectData.services,
      };

      setProject(fullProject);
      setIsLoading(false);
    };

    fetchProjectDetails();
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
    // TODO: Implement Supabase update logic
    if (editedProject) {
      setProject(editedProject);
      toast.info("Saving changes to the database is not yet implemented.");
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

  const showNotImplementedToast = () => {
    toast.info("This feature is not yet connected to the database.");
  };

  if (isLoading || !project) {
    return <PortalLayout><div>Loading project details...</div></PortalLayout>;
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
          canEdit={true} // TODO: Add logic to check if user can edit
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
            onUpdateTasks={showNotImplementedToast}
            onTaskStatusChange={showNotImplementedToast}
            onTaskDelete={showNotImplementedToast}
            onAddCommentOrTicket={showNotImplementedToast}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <ProjectSidebar
            project={project}
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