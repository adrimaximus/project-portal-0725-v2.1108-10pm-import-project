import { useState, useEffect } from 'react';
import { Mention, MentionsInput, SuggestionDataItem } from 'react-mentions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

interface UserSuggestion extends SuggestionDataItem {
  avatar_url: string;
  initials: string;
}

interface ProjectSuggestion extends SuggestionDataItem {
  slug: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MentionInput = ({ value, onChange, placeholder }: MentionInputProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserSuggestion[]>({
    queryKey: ['mention-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
      if (error) throw error;
      return data.map(p => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          display: name || p.email,
          avatar_url: p.avatar_url,
          initials: (name ? (name.split(' ')[0][0] + (name.split(' ').length > 1 ? name.split(' ')[1][0] : '')) : p.email[0]).toUpperCase(),
        };
      });
    },
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery<ProjectSuggestion[]>({
    queryKey: ['mention-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name, slug');
      if (error) throw error;
      return data.map(p => ({
        id: p.id,
        display: p.name,
        slug: p.slug,
      }));
    },
  });

  const fetchUsers = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    if (isLoadingUsers || !users) return;
    const filteredUsers = users.filter(user =>
      user.display.toLowerCase().includes(query.toLowerCase())
    );
    callback(filteredUsers);
  };

  const fetchProjects = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    if (isLoadingProjects || !projects) return;
    const filteredProjects = projects.filter(project =>
      project.display.toLowerCase().includes(query.toLowerCase())
    );
    callback(filteredProjects);
  };

  const renderUserSuggestion = (suggestion: SuggestionDataItem) => {
    return (
      <div className="flex items-center p-2">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={getAvatarUrl((suggestion as UserSuggestion).avatar_url) || undefined} />
          <AvatarFallback style={{ backgroundColor: generatePastelColor(suggestion.id) }}>{(suggestion as UserSuggestion).initials}</AvatarFallback>
        </Avatar>
        <span>{suggestion.display}</span>
      </div>
    );
  };

  const renderProjectSuggestion = (suggestion: SuggestionDataItem) => {
    return (
      <div className="flex items-center p-2">
        <div className="h-8 w-8 mr-2 bg-gray-200 rounded-md flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-gray-600" />
        </div>
        <span>{suggestion.display}</span>
      </div>
    );
  };

  if (!isClient) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-2 border rounded-md" />;
  }

  return (
    <MentionsInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mentions"
      classNames={{
        control: 'mentions__control',
        input: 'mentions__input',
        suggestions: 'mentions__suggestions',
      }}
    >
      <Mention
        trigger="@"
        data={fetchUsers}
        renderSuggestion={renderUserSuggestion}
        markup="@[__display__](__id__)"
        className="mentions__mention"
      />
      <Mention
        trigger="#"
        data={fetchProjects}
        renderSuggestion={renderProjectSuggestion}
        markup="#[__display__](__id__)"
        className="mentions__mention"
      />
    </MentionsInput>
  );
};

export default MentionInput;