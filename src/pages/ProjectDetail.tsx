import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, Comment, AssignedUser, ProjectStatus, PaymentStatus, ProjectFile } from "@/types";
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

const fetchProject = async (slug: string) => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
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
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const { data: projectData, isLoading, error } = useQuery<any>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug!),
    enabled: !!slug && !!user,
  });

  const project: Project | null = projectData ? {
    ...projectData,
    startDate: projectData.start_date,
    dueDate: projectData.due_date,
    paymentStatus: projectData.payment_status,
    paymentDueDate: projectData.payment_due_date,
    createdBy: projectData.created_by,
    assignedTo: projectData.assignedTo,
    briefFiles: projectData.briefFiles,
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

    const { id, name, description, category, status, budget, startDate, dueDate, paymentStatus, paymentDueDate, services, assignedTo } = editedProject;
    
    const { error } = await supabase
      .rpc('update_project_details', {
        p_project_id: id,
        p_name: name,
        p_description: description,
        p_category: category,
        p_status: status,
        p_budget: budget,
        p_start_date: startDate,
        p_due_date: dueDate,
        p_payment_status: paymentStatus,
        p_payment_due_date: paymentDueDate,
        p_member_ids: assignedTo.map(m => m.id),
        p_service_titles: services || [],
      });

    if (error) {
      toast.error("Failed to save project", { description: error.message });
      return;
    }

    toast.success("Project saved successfully!");
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ["project", slug] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    queryClient.invalidateQueries({ queryKey: ["project", slug] });
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
    queryClient.invalidateQueries({ queryKey: ["project", slug] });
  };

  const handleTaskAdd = (title: string) => console.log("Add task:", title);
  const handleTaskAssignUsers = (taskId: string, userIds: string[]) => console.log("Assign users to task:", taskId, userIds);
  const handleTaskStatusChange = (taskId: string, completed: boolean) => console.log("Change task status:", taskId, completed);
  const handleTaskDelete = (taskId: string) => console.log("Delete task:", taskId);
  const handleAddCommentOrTicket = (text: string, isTicket: boolean, attachment: File | null) => console.log("Add comment/ticket:", text, isTicket, attachment);

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error) {
    toast.error("Failed to load project", { description: "Please check the URL or try again later." });
    navigate("/projects");
    return null;
  }
  if (!project || !editedProject) return null;

  const canEdit = user && (user.id === project.createdBy.id || user.role === 'admin' || user.role === 'master admin');

  return (
    <PortalLayout>
      <div className="space-y-4">
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(true)}
          onSaveChanges={handleSave}
          onCancelChanges={handleCancel}
          canEdit={canEdit}
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
          onCategoryChange={(value) => handleFieldChange('category', value)}
          onTeamChange={(users) => handleFieldChange('assignedTo', users)}
          onServicesChange={(services) => handleFieldChange('services', services)}
          onFilesAdd={handleFilesAdd}
          onFileDelete={handleFileDelete}
          onTaskAdd={handleTaskAdd}
          onTaskAssignUsers={handleTaskAssignUsers}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskDelete={handleTaskDelete}
          onAddCommentOrTicket={handleAddCommentOrTicket}
        />
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;