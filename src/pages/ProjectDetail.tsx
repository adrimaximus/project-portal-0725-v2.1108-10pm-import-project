import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ProjectDescription from '@/components/project-detail/ProjectDescription';
import ProjectBrief, { ProjectFile } from '@/components/project-detail/ProjectBrief';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .rpc('get_project_by_slug', { p_slug: slug })
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (project) {
      setDescription(project.description || '');
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: async (updatedData: { description?: string }) => {
      if (!project) return;
      const { error } = await supabase
        .from('projects')
        .update(updatedData)
        .eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Project updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
      setIsEditingDescription(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update project.', { description: error.message });
    },
  });

  const handleDescriptionSave = () => {
    updateProjectMutation.mutate({ description });
  };

  const handleFilesChange = async (files: File[]) => {
    if (!project || !user) return;
    setIsUploading(true);
    
    for (const file of files) {
      const filePath = `${project.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from('project-files').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('project_files').insert({
        project_id: project.id,
        user_id: user.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrlData.publicUrl,
        storage_path: filePath,
      });

      if (insertError) {
        toast.error(`Failed to save ${file.name} record: ${insertError.message}`);
        // Clean up uploaded file if db insert fails
        await supabase.storage.from('project-files').remove([filePath]);
      }
    }
    
    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ['project', slug] });
    toast.success('Files uploaded successfully.');
  };

  const handleFileDelete = async (storagePath: string) => {
    if (!project) return;

    const { error: deleteStorageError } = await supabase.storage
      .from('project-files')
      .remove([storagePath]);

    if (deleteStorageError) {
      toast.error(`Failed to delete file from storage: ${deleteStorageError.message}`);
      return;
    }

    const { error: deleteDbError } = await supabase
      .from('project_files')
      .delete()
      .eq('storage_path', storagePath);

    if (deleteDbError) {
      toast.error(`Failed to delete file record: ${deleteDbError.message}`);
      // Maybe try to re-upload if this fails? For now, just notify.
    } else {
      toast.success('File deleted successfully.');
    }

    queryClient.invalidateQueries({ queryKey: ['project', slug] });
  };

  if (isLoading) {
    return <PortalLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (isError || !project) {
    return <PortalLayout><div>Error loading project or project not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <ProjectDescription
            description={description}
            isEditing={isEditingDescription}
            onDescriptionChange={setDescription}
            onSetIsEditing={setIsEditingDescription}
          />
          {isEditingDescription && (
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
              <Button onClick={handleDescriptionSave} disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Description
              </Button>
            </div>
          )}
        </div>

        <div>
          <ProjectBrief
            files={project.briefFiles as ProjectFile[] || []}
            isEditing={isEditingBrief}
            onSetIsEditing={setIsEditingBrief}
            onFilesChange={handleFilesChange}
            onFileDelete={handleFileDelete}
            isUploading={isUploading}
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;