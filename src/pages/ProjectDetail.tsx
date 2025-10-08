import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectOverview from '@/components/project-detail/ProjectOverview';
import ProjectTasks from '@/components/project-detail/ProjectTasks';
import ProjectBrief from '@/components/project-detail/ProjectBrief';
import ProjectComments from '@/components/ProjectComments';
import ProjectActivity from '@/components/project-detail/ProjectActivity';

const fetchProjectBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectBySlug(slug!),
    enabled: !!slug && !!user,
  });

  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pinnedProjects, setPinnedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (project) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
    }
  }, [project]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pinnedProjects');
      setPinnedProjects(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error("Failed to parse pinned projects from localStorage", e);
      setPinnedProjects([]);
    }
  }, []);

  const isPinned = project ? pinnedProjects.includes(project.id) : false;

  const handleTogglePin = () => {
    if (!project) return;
    const newPinned = isPinned
      ? pinnedProjects.filter(id => id !== project.id)
      : [...pinnedProjects, project.id];
    
    setPinnedProjects(newPinned);
    localStorage.setItem('pinnedProjects', JSON.stringify(newPinned));
    toast.success(isPinned ? 'Project unpinned' : 'Project pinned');
    queryClient.invalidateQueries({ queryKey: ['pinnedProjects'] });
  };

  const updateMutation = useMutation({
    mutationFn: async (updatedProject: Partial<Project>) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', project!.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
      queryClient.invalidateQueries({ queryKey: ['dashboardProjects'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error('Failed to update project', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboardProjects'] });
      navigate('/projects');
    },
    onError: (error) => {
      toast.error('Failed to delete project', { description: error.message });
    },
  });

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleSaveChanges = () => {
    if (editedProject) {
      const changes: Partial<Project> = {};
      (Object.keys(editedProject) as Array<keyof Project>).forEach(key => {
        if (JSON.stringify(editedProject[key]) !== JSON.stringify(project?.[key])) {
          (changes as any)[key] = editedProject[key];
        }
      });
      if (Object.keys(changes).length > 0) {
        updateMutation.mutate(changes);
      } else {
        setIsEditing(false);
      }
    }
  };

  const handleCancelChanges = () => {
    if (project) setEditedProject(JSON.parse(JSON.stringify(project)));
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [field]: value });
    }
  };

  const handleToggleComplete = () => {
    if (!project) return;
    const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
    updateMutation.mutate({ status: newStatus });
  };

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(project!.id);
    }
  };

  if (isLoading || !user) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }

  if (!project || !editedProject) {
    return <div>Project not found.</div>;
  }

  const canEdit = user?.id === project.created_by.id || user?.role === 'admin' || user?.role === 'master admin';

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={editedProject}
        isEditing={isEditing}
        isSaving={updateMutation.isPending}
        canEdit={canEdit}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        onEditToggle={handleEditToggle}
        onSaveChanges={handleSaveChanges}
        onCancelChanges={handleCancelChanges}
        onToggleComplete={handleToggleComplete}
        onDeleteProject={handleDeleteProject}
        onFieldChange={handleFieldChange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectOverview project={editedProject} onFieldChange={handleFieldChange} isEditing={isEditing} />
          <ProjectTasks project={project} onTaskAdd={() => {}} onTaskAssignUsers={() => {}} onTaskStatusChange={() => {}} onTaskDelete={() => {}} />
          <ProjectBrief project={project} />
          <ProjectComments project={project} />
        </div>
        <div className="lg:col-span-1">
          <ProjectActivity activities={project.activities} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;