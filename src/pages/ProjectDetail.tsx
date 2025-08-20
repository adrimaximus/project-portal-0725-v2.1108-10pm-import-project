import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectTeamCard from "@/components/project-detail/ProjectTeamCard";
import ProjectDetailsCard from "@/components/project-detail/ProjectDetailsCard";
import ProjectStatusCard from "@/components/project-detail/ProjectStatusCard";
import ProjectPaymentStatusCard from "@/components/project-detail/ProjectPaymentStatusCard";

const fetchProject = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw new Error(error.message);
  }
  return data as Project | null;
};

const ProjectDetailSkeleton = () => (
  <PortalLayout>
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
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
  const [isSaving, setIsSaving] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const { data: project, isLoading, error } = useQuery<Project | null>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug!),
    enabled: !!slug && !!user,
  });

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

  // Realtime: sinkron komentar & aktivitas proyek
  useEffect(() => {
    if (!project || !slug) return;

    const channel = supabase.channel(`project-detail-${project.id}`);

    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `project_id=eq.${project.id}` }, handleInvalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_activities', filter: `project_id=eq.${project.id}` }, handleInvalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_files', filter: `project_id=eq.${project.id}` }, handleInvalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, slug, queryClient]);

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!editedProject || !project) return;
    setIsSaving(true);

    try {
      const { id, name, description, category, status, budget, start_date, due_date, payment_status, payment_due_date, services, assignedTo, venue } = editedProject;
      
      const { data: updatedProjectRow, error } = await supabase
        .rpc('update_project_details', {
          p_project_id: id,
          p_name: name,
          p_description: description || null,
          p_category: category || null,
          p_status: status,
          p_budget: budget || null,
          p_start_date: start_date || null,
          p_due_date: due_date || null,
          p_payment_status: payment_status,
          p_payment_due_date: payment_due_date || null,
          p_member_ids: assignedTo.map(m => m.id),
          p_service_titles: services || [],
          p_venue: venue || null,
        })
        .single();

      if (error) throw error;

      if (updatedProjectRow) {
          const typedUpdatedProjectRow = updatedProjectRow as { slug: string };
          
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          
          if (slug !== typedUpdatedProjectRow.slug) {
              toast.success("Project updated successfully! Redirecting...");
              navigate(`/projects/${typedUpdatedProjectRow.slug}`, { replace: true });
          } else {
              await queryClient.invalidateQueries({ queryKey: ["project", slug] });
              toast.success("Project updated successfully!");
              setIsEditing(false);
          }
      }
    } catch (err: any) {
      toast.error("Failed to save project", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleFilesAdd = async (files: File[]) => {
    if (!project || !user) return;
    toast.info(`Uploading ${files.length} file(s)...`);
    const failedUploads: string[] = [];

    for (const file of files) {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `${project.id}/${Date.now()}-${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`, { description: uploadError.message });
        failedUploads.push(file.name);
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
        failedUploads.push(file.name);
        await supabase.storage.from('project-files').remove([filePath]);
      }
    }

    if (failedUploads.length === files.length) {
      // All failed
    } else if (failedUploads.length > 0) {
      toast.warning(`${files.length - failedUploads.length} file(s) uploaded, but ${failedUploads.length} failed.`);
    } else {
      toast.success("All files uploaded successfully!");
    }

    if (failedUploads.length < files.length) {
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    }
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

  const handleTaskAdd = async (title: string) => {
    if (!project || !user) return;
    const { error } = await supabase.from('tasks').insert({ project_id: project.id, title, created_by: user.id });
    if (error) toast.error("Failed to add task", { description: error.message });
    else {
      toast.success("Task added successfully.");
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    }
  };

  const handleTaskAssignUsers = async (taskId: string, userIds: string[]) => {
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    if (userIds.length > 0) {
      const newAssignees = userIds.map(uid => ({ task_id: taskId, user_id: uid }));
      const { error } = await supabase.from('task_assignees').insert(newAssignees);
      if (error) toast.error("Failed to assign users", { description: error.message });
      else toast.success("Task assignments updated.");
    }
    queryClient.invalidateQueries({ queryKey: ["project", slug] });
  };

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const { error } = await supabase.from('tasks').update({ completed }).eq('id', taskId);
    if (error) toast.error("Failed to update task status", { description: error.message });
    else {
      toast.success(`Task marked as ${completed ? 'complete' : 'incomplete'}.`);
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) toast.error("Failed to delete task", { description: error.message });
    else {
      toast.success("Task deleted.");
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    }
  };

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachment: File | null) => {
    if (!project || !user) return;
    let attachment_url = null;
    let attachment_name = null;

    if (attachment) {
      const filePath = `${project.id}/comments/${Date.now()}-${attachment.name}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, attachment);
      if (uploadError) {
        toast.error("Failed to upload attachment.", { description: uploadError.message });
        return;
      }
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
      attachment_url = urlData.publicUrl;
      attachment_name = attachment.name;
    }

    const { data: commentData, error: commentError } = await supabase.from('comments').insert({
      project_id: project.id,
      author_id: user.id,
      text,
      is_ticket: isTicket,
      attachment_url,
      attachment_name,
    }).select().single();

    if (commentError) {
      toast.error("Failed to post comment.", { description: commentError.message });
      return;
    }

    // Optimistic update: tampilkan segera di UI penulis
    if (commentData) {
      const authorUser = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        initials: user.initials,
      };
      queryClient.setQueryData(["project", slug], (prev: any) => {
        if (!prev) return prev;
        const optimistic = {
          id: commentData.id,
          text,
          timestamp: commentData.created_at,
          isTicket,
          attachment_url,
          attachment_name,
          author: authorUser,
        };
        return { ...prev, comments: [optimistic, ...(prev.comments || [])] };
      });
    }

    if (isTicket && commentData) {
      const { error: taskError } = await supabase.from('tasks').insert({
        project_id: project.id,
        created_by: user.id,
        title: text.substring(0, 100),
        origin_ticket_id: commentData.id,
      });
      if (taskError) {
        toast.warning("Ticket created, but failed to create a corresponding task.", { description: taskError.message });
      } else {
        toast.success("Ticket created and added to tasks.");
      }
    } else {
      toast.success("Comment posted.");
    }
    // Realtime akan menyamakan state di member lain
  };

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error) {
    toast.error("Failed to load project", { description: "Please check the URL or try again later." });
    navigate("/projects");
    return null;
  }
  if (!project || !editedProject) return null;

  const canEdit = user && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader
          project={editedProject}
          isEditing={isEditing}
          isSaving={isSaving}
          onEditToggle={() => setIsEditing(true)}
          onSaveChanges={handleSave}
          onCancelChanges={handleCancel}
          canEdit={canEdit}
          onFieldChange={handleFieldChange}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <ProjectDetailsCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <ProjectMainContent
              project={editedProject}
              isEditing={isEditing}
              onDescriptionChange={(value) => handleFieldChange('description', value)}
              onCategoryChange={(value) => handleFieldChange('category', value)}
              onTeamChange={(users) => handleFieldChange('assignedTo', users)}
              onFilesAdd={handleFilesAdd}
              onFileDelete={handleFileDelete}
              onServicesChange={(services) => handleFieldChange('services', services)}
              onTaskAdd={handleTaskAdd}
              onTaskAssignUsers={handleTaskAssignUsers}
              onTaskStatusChange={handleTaskStatusChange}
              onTaskDelete={handleTaskDelete}
              onAddCommentOrTicket={handleAddCommentOrTicket}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard project={editedProject} />
            <ProjectStatusCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <ProjectPaymentStatusCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <ProjectTeamCard
              project={editedProject}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;