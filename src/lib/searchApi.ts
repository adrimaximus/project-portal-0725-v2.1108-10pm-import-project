import { supabase } from '@/integrations/supabase/client';
import { UserSuggestion, ProjectSuggestion } from '@/components/MentionInput';

export const searchUsers = async (term: string): Promise<UserSuggestion[]> => {
  if (!term) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, email')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(5);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data.map(user => ({
    id: user.id,
    display: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    avatar_url: user.avatar_url,
    initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email.substring(0, 2).toUpperCase(),
  }));
};

export const searchProjects = async (term: string): Promise<ProjectSuggestion[]> => {
  if (!term) return [];
  const { data, error } = await supabase
    .rpc('search_projects', { p_search_term: term, p_limit: 5 });

  if (error) {
    console.error('Error searching projects:', error);
    return [];
  }

  return data.map(project => ({
    id: project.id,
    display: project.name,
    slug: project.slug,
  }));
};