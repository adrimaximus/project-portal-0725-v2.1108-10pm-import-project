import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase } from 'lucide-react';
import * as chatApi from '@/lib/chatApi';

export interface UserSuggestion {
  id: string;
  display: string;
  avatar_url?: string;
  initials: string;
}

export interface ProjectSuggestion {
  id: string;
  display: string;
  slug: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  userSuggestions: UserSuggestion[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, userSuggestions, placeholder, disabled, className }, ref) => {
    
    const handleTextChange = (event: any, newValue: string) => {
      onChange(newValue);
    };

    const fetchProjects = (query: string, callback: (data: { id: string, display: string }[]) => void) => {
      chatApi.searchProjects(query).then(projects => 
        callback(projects.map(p => ({ id: p.slug, display: p.name })))
      );
    };

    return (
      <MentionsInput
        value={value}
        onChange={handleTextChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        classNames={{
          control: 'relative w-full',
          input: `w-full min-h-[40px] p-3 text-sm rounded-lg border bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`,
          suggestions: {
            list: 'bg-popover text-popover-foreground border rounded-lg shadow-lg p-1 mt-2 z-10 max-h-60 overflow-y-auto',
            item: 'flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none',
            itemFocused: 'bg-accent text-accent-foreground',
          },
        }}
        inputRef={ref}
        allowSpaceInQuery
      >
        <Mention
          trigger="@"
          data={userSuggestions}
          renderSuggestion={(suggestion: any) => (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{suggestion.display}</span>
            </>
          )}
          appendSpaceOnAdd
          markup="@[__display__](__id__)"
          displayTransform={(id, display) => `@${display}`}
        />
        <Mention
          trigger="/"
          data={fetchProjects}
          renderSuggestion={(suggestion: any) => (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{suggestion.display}</span>
            </div>
          )}
          appendSpaceOnAdd
          markup="[__display__](/projects/__id__)"
          displayTransform={(id, display) => `/${display}`}
        />
      </MentionsInput>
    );
  }
);

export default MentionInput;