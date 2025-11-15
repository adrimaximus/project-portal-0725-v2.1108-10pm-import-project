import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';

const fetchTaskProjectSlug = async (taskId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('projects(slug)')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  
  const project = (data?.projects as { slug: string }[] | { slug: string } | null);
  const projectObject = Array.isArray(project) ? project[0] : project;

  if (!projectObject || !projectObject.slug) {
    throw new Error('Project for this task could not be found.');
  }
  return projectObject.slug;
};

const TaskRedirectPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { data: projectSlug, isLoading, isError } = useQuery({
    queryKey: ['taskProjectSlug', taskId],
    queryFn: () => fetchTaskProjectSlug(taskId!),
    enabled: !!taskId,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (isError || !projectSlug) {
        toast.error("Could not find the requested task.");
        navigate('/projects?view=tasks', { replace: true });
      } else {
        navigate(`/projects/${projectSlug}?tab=tasks&task=${taskId}`, { replace: true });
      }
    }
  }, [isLoading, isError, projectSlug, taskId, navigate]);

  return <LoadingScreen />;
};

export default TaskRedirectPage;