import { useParams } from 'react-router-dom';
import { useProject } from './useProject';

export const useCurrentProject = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = useProject(slug || '');
  return { project, isLoading, error };
};