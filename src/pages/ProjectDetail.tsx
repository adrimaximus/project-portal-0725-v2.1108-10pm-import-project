import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, AssignedUser, ProjectStatus, PaymentStatus, ProjectFile } from "@/data/projects";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { Skeleton } from "@/components/ui/skeleton";
import { mapProfileToUser } from "@/lib/utils";

const fetchProject = async (projectId: string, user: any) => {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      created_by:profiles!projects_created_by_fkey(*),
      assignedTo:project_members(*, user:profiles(*)),
      tasks(*, assignedTo:task_assignees(*, user:profiles(*))),
      comments(*, author:profiles(*)),
      briefFiles:project_files(*)
    `)
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw new Error(error.message);
  }
  return data;
};

const ProjectDetailSkeleton = () => (
  <PortalLayout>
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  </PortalLayout>
);

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId!, user),
    enabled: !!projectId && !!user,
  });

  const project: Project | null = projectData ? {
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
    assignedTo: projectData.assignedTo?.map((m: any) => ({ ...mapProfileToUser(m.user), role: m.role })) || [],
    tasks: projectData.tasks?.map((t: any) => ({
      ...t,
      assignedTo: t.assignedTo?.map((a: any) => mapProfileToUser(a.user)) || []
    })) || [],
    comments: projectData.comments?.map((c: any) => ({
      ...c,
      id: c.id,
      author: c.author ? mapProfileToUser(c.author) : { id: 'unknown', name: 'Unknown', email: '', avatar: '', initials: 'U' },
      text: c.text,
      timestamp: c.created_at,
      isTicket: c.is_ticket,
      attachment_url: c.attachment_url,
      attachment_name: c.attachment_name,
    })) || [],
    briefFiles: projectData.briefFiles || [],
    services: projectData.services || [],
  } : null;

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!editedProject || !project) return;

    const { name, description, status, budget, startDate, dueDate, paymentStatus, paymentDueDate, services, assignedTo } = editedProject;
    
    const { error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        status,
        budget,
        start_date: startDate,
        due_date: dueDate,
        payment_status: paymentStatus,
        payment_due_date: paymentDueDate,
      })
      .eq('id', project.id);

    if (error) {
      toast.error("Failed to save project", { description: error.message });
      return;
    }

    // Team members
    const originalMemberIds = new Set(project.assignedTo.map(m => m.id));
    const newMemberIds = new Set(assignedTo.map(m => m.id));
    const membersToAdd = assignedTo.filter(m => !originalMemberIds.has(m.id));
    const membersToRemove = project.assignedTo.filter(m => !newMemberIds.has(m.id));

    if (membersToAdd.length > 0) {
      const { error: addError } = await supabase.from('project_members').insert(membersToAdd.map(m => ({ project_id: project.id, user_id: m.id, role: m.role })));
      if (addError) toast.error("Failed to add team members", { description: addError.message });
    }
    if (membersToRemove.length > 0) {
      const { error: removeError } = await supabase.from('project_members').delete().eq('project_id', project.id).in('user_id', membersToRemove.map(m => m.id));
      if (removeError) toast.error("Failed to remove team members", { description: removeError.message });
    }

    // Services
    const originalServiceTitles = new Set(project.services || []);
    const newServiceTitles = new Set(editedProject.services || []);
    const servicesToAdd = (editedProject.services || []).filter(s => !originalServiceTitles.has(s));
    const servicesToRemove = (project.services || []).filter(s => !newServiceTitles.has(s));

    if (servicesToAdd.length > 0) {
        const { error: addError } = await supabase.from('project_services').insert(servicesToAdd.map(s => ({ project_id: project.id, service_title: s })));
        if (addError) toast.error("Failed to add services", { description: addError.message });
    }
    if (servicesToRemove.length > 0) {
        const { error: removeError } = await supabase.from('project_services').delete().eq('project_id', project.id).in('service_title', servicesToRemove);
        if (removeError) toast.error("Failed to remove services", { description: removeError.message });
    }

    toast.success("Project saved successfully!");
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleFilesAdd = async (files: File[]) => {
    if (!project || !user) return;
    toast.info(`Uploading ${files.length} file(s)...`);

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${project.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`, { description: uploadError.message });
        continue;
      }

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('project_files').insert({
        project_id: project.id,
        user_id: user.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        storage_path: filePath,
      });

      if (dbError) {
        toast.error(`Failed to save ${file.name} to database`, { description: dbError.message });
      }
    }
    toast.success("File upload complete!");
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const handleFileDelete = async (fileId: string) => {
    if (!project) return;
    const fileToDelete = project.briefFiles?.find(f => f.id === fileId);
    if (!fileToDelete) return;

    const { error: storageError } = await supabase.storage.from('project-files').remove([fileToDelete.storage_path]);
    if (storageError) {
      toast.error("Failed to delete file from storage", { description: storageError.message });
      return;
    }

    const { error: dbError } = await supabase.from('project_files').delete().eq('id', fileId);
    if (dbError) {
      toast.error("Failed to delete file from database", { description: dbError.message });
      return;
    }

    toast.success("File deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error) {
    toast.error("Failed to load project", { description: "Please check the URL or try again later." });
    navigate("/projects");
    return null;
  }
  if (!project || !editedProject) return null;

  return (
    <PortalLayout>
      <div className="space-y-4">
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFieldChange={(value) => handleFieldChange('name', value)}
          editedName={editedProject.name}
        />
        <ProjectInfoCards
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onFieldChange={handleFieldChange}
          onDateChange={(name, date) => handleFieldChange(name, date?.toISOString())}
          onBudgetChange={(value) => handleFieldChange('budget', value)}
        />
        <ProjectMainContent
          project={editedProject}
          isEditing={isEditing}
          onDescriptionChange={(value) => handleFieldChange('description', value)}
          onTeamChange={(users) => handleFieldChange('assignedTo', users)}
          onServicesChange={(services) => handleFieldChange('services', services)}
          onFilesAdd={handleFilesAdd}
          onFileDelete={handleFileDelete}
        />
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;