import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, User } from '@/types';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { toast } from 'sonner';

const fetchProjectBySlug = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug });

  if (error) {
    console.error('Error fetching project by slug:', error);
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  return data[0] as Project;
};

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutations = useProjectMutations(slug || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

  if (isLoading) return <PortalLayout><div className="p-6">Loading project...</div></PortalLayout>;
  if (error) return <PortalLayout><div className="p-6 text-destructive">Error: {error.message}</div></PortalLayout>;
  if (!project) return <PortalLayout><div className="p-6">Project not found.</div></PortalLayout>;

  const canEdit = user && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [field]: value });
    }
  };

  const handleSave = () => {
    if (editedProject) {
      mutations.updateProject.mutate(editedProject, {
        onSuccess: () => setIsEditing(false),
      });
    }
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
    if (editedProject) {
      mutations.updateProject.mutate({ ...editedProject, status: newStatus });
    }
  };

  const handleDeleteProject = () => {
    mutations.deleteProject.mutate(project.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <ProjectHeader
          project={editedProject || project}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <ProjectMainContent
              project={editedProject || project}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
              mutations={mutations}
            />
          </div>
        </div>

        {canEdit && (
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t p-4">
            <div className="max-w-6xl mx-auto flex justify-end items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleSave} disabled={mutations.updateProject.isPending}>
                    {mutations.updateProject.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleToggleComplete}>
                    {project.status === 'Completed' ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {project.status === 'Completed' ? 'Mark as In Progress' : 'Mark as Complete'}
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Project
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{project.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default ProjectDetailPage;