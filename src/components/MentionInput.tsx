import { useState, useEffect, forwardRef } from 'react';
import { Mention, MentionsInput, SuggestionDataItem } from 'react-mentions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

export interface UserSuggestion extends SuggestionDataItem {
  avatar_url: string;
  initials: string;
}

export interface ProjectSuggestion extends SuggestionDataItem {
  slug: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  userSuggestions: UserSuggestion[];
  projectSuggestions: ProjectSuggestion[];
  onSearchTermChange: (trigger: '@' | '/' | null, term: string) => void;
  disabled?: boolean;
  className?: string;
}

const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(({ value, onChange, onKeyDown, placeholder, userSuggestions, projectSuggestions, onSearchTermChange, disabled, className }, ref) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUsers = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    const filteredUsers = userSuggestions.filter(user =>
      user.display.toLowerCase().includes(query.toLowerCase())
    );
    callback(filteredUsers);
  };

  const fetchProjects = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    const filteredProjects = projectSuggestions.filter(project =>
      project.display.toLowerCase().includes(query.toLowerCase())
    );
    callback(filteredProjects);
  };

  const renderUserSuggestion = (suggestion: SuggestionDataItem) => {
    const userSuggestion = suggestion as UserSuggestion;
    return (
      <div className="flex items-center p-2">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={getAvatarUrl(userSuggestion.avatar_url) || undefined} />
          <AvatarFallback style={{ backgroundColor: generatePastelColor(userSuggestion.id as string) }}>{userSuggestion.initials}</AvatarFallback>
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
    return <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-2 border rounded-md" />;
  }

  return (
    <MentionsInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="mentions"
      classNames={{
        control: 'mentions__control',
        input: `mentions__input ${className || ''}`,
        suggestions: 'mentions__suggestions',
      }}
      inputRef={ref}
      disabled={disabled}
    >
      <Mention
        trigger="@"
        data={fetchUsers}
        renderSuggestion={renderUserSuggestion}
        markup="@[__display__](__id__)"
        className="mentions__mention"
        onAdd={() => onSearchTermChange(null, '')}
      />
      <Mention
        trigger="/"
        data={fetchProjects}
        renderSuggestion={renderProjectSuggestion}
        markup="/[__display__](__id__)"
        className="mentions__mention"
        onAdd={() => onSearchTermChange(null, '')}
      />
    </MentionsInput>
  );
});

export default MentionInput;