import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { Project, Tag } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { useQueryClient } from '@tanstack/react-query';

const ProjectDetail = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: project, isLoading, isError, error } = useProject(projectSlug || '');
  const mutations = useProjectMutations(projectSlug);

  const [isEditing, setIsEditing] = useState(false);
  const [editableProject, setEditableProject] = useState<Project | null>(null);

  const defaultTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'tasks';
  }, [location.search]);

  useEffect(() => {
    if (project) {
      setEditableProject(project);
    }
  }, [project]);

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditableProject(prev => {
      if (!prev) return null;
      if (field === 'tags') {
        const newTags = value as Tag[];
        const existingTagIds = prev.tags?.map(t => t.id) || [];
        const newTagIds = newTags.map(t => t.id);
        const addedTags = newTags.filter(t => !existingTagIds.includes(t.id));
        const removedTags = prev.tags?.filter(t => !newTagIds.includes(t.id)) || [];
        
        if (addedTags.length > 0) {
          mutations.addTags.mutate({ tagIds: addedTags.map(t => t.id) });
        }
        if (removedTags.length > 0) {
          mutations.removeTags.mutate({ tagIds: removedTags.map(t => t.id) });
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = () => {
    if (editableProject) {
      const { assignedTo, services, tags, ...updatePayload } = editableProject;
      
      const changedFields: Partial<Project> = {};
      if (project) {
        for (const key in updatePayload) {
          if (updatePayload[key as keyof typeof updatePayload] !== project[key as keyof typeof project]) {
            (changedFields as any)[key] = updatePayload[key as keyof typeof updatePayload];
          }
        }
      }

      if (Object.keys(changedFields).length > 0) {
        mutations.updateProject.mutate(
          { ...changedFields, id: editableProject.id },
          {
            onSuccess: (data) => {
              toast.success('Project details updated successfully');
              queryClient.invalidateQueries({ queryKey: ['project', projectSlug] });
              if (data && data.slug !== projectSlug) {
                navigate(`/projects/${data.slug}`, { replace: true });
              }
            },
            onError: (error) => {
              toast.error(`Failed to update project: ${error.message}`);
            },
          }
        );
      }

      const originalMemberIds = new Set(project?.assignedTo?.map(m => m.id));
      const newMemberIds = new Set(assignedTo?.map(m => m.id));
      const membersToAdd = assignedTo?.filter(m => !originalMemberIds.has(m.id));
      const membersToRemove = project?.assignedTo?.filter(m => !newMemberIds.has(m.id));

      if (membersToAdd && membersToAdd.length > 0) {
        mutations.addMembers.mutate({ members: membersToAdd });
      }
      if (membersToRemove && membersToRemove.length > 0) {
        mutations.removeMembers.mutate({ memberIds: membersToRemove.map(m => m.id) });
      }

      const originalServiceTitles = new Set(project?.services?.map(s => s));
      const newServiceTitles = new Set(services?.map(s => s));
      const servicesToAdd = services?.filter(s => !originalServiceTitles.has(s));
      const servicesToRemove = project?.services?.filter(s => !newServiceTitles.has(s));

      if (servicesToAdd && servicesToAdd.length > 0) {
        mutations.addServices.mutate({ serviceTitles: servicesToAdd });
      }
      if (servicesToRemove && servicesToRemove.length > 0) {
        mutations.removeServices.mutate({ serviceTitles: servicesToRemove });
      }

      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (project) {
      setEditableProject(project);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      mutations.deleteProject.mutate(undefined, {
        onSuccess: () => {
          toast.success('Project deleted successfully');
          navigate('/projects');
        },
        onError: (error) => {
          toast.error(`Failed to delete project: ${error.message}`);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500 p-8">Error loading project: {error?.message}</div>;
  }

  if (!project || !editableProject) {
    return <div className="text-center text-muted-foreground p-8">Project not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader
        project={editableProject}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onFieldChange={handleFieldChange}
        isSaving={mutations.updateProject.isLoading}
      />
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1">
            <div className="bg-background rounded-lg">
              <ProjectMainContent
                project={editableProject}
                isEditing={isEditing}
                onFieldChange={handleFieldChange}
                mutations={mutations}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;