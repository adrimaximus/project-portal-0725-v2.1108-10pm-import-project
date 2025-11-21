import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { MentionsInput as ReactMentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase, ListChecks, CreditCard } from 'lucide-react';
import '@/styles/mentions.css'; 

export interface UserSuggestion {
  id: string;
  display: string;
  avatar_url?: string;
  initials: string;
  email?: string;
}

export interface ProjectSuggestion {
  id: string;
  display: string;
  slug: string;
}

export interface TaskSuggestion {
  id: string;
  display: string;
  project_slug: string;
}

export interface BillSuggestion {
  id: string;
  display: string;
  slug: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement> | any) => void;
  userSuggestions: UserSuggestion[];
  projectSuggestions: ProjectSuggestion[];
  taskSuggestions?: TaskSuggestion[];
  billSuggestions?: BillSuggestion[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, userSuggestions, projectSuggestions, taskSuggestions, billSuggestions, placeholder, disabled, className }, ref) => {
    
    // Mapping data for react-mentions
    const userData = userSuggestions.map(u => ({
      id: u.id,
      display: u.display,
      avatar_url: u.avatar_url,
      initials: u.initials,
      email: u.email
    }));

    const resourceData = [
      ...projectSuggestions.map(p => ({ id: `project:${p.slug}`, display: p.display, type: 'project' })),
      ...(taskSuggestions || []).map(t => ({ id: `task:${t.project_slug}:${t.id}`, display: t.display, type: 'task' })),
      ...(billSuggestions || []).map(b => ({ id: `bill:${b.slug}`, display: b.display, type: 'bill' }))
    ];

    const renderUserSuggestion = (suggestion: SuggestionDataItem & { avatar_url?: string, initials?: string, email?: string }, search: string, highlightedDisplay: React.ReactNode, index: number, focused: boolean) => (
      <div className={`mention-suggestion ${focused ? 'focused' : ''} flex items-center p-2`}>
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id as string)} />
          <AvatarFallback style={generatePastelColor(suggestion.id as string)}>{suggestion.initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{highlightedDisplay}</span>
          <span className="text-xs text-muted-foreground">{suggestion.email}</span>
        </div>
      </div>
    );

    const renderResourceSuggestion = (suggestion: SuggestionDataItem & { type?: string }, search: string, highlightedDisplay: React.ReactNode, index: number, focused: boolean) => {
      let Icon = Briefcase;
      if (suggestion.type === 'task') Icon = ListChecks;
      if (suggestion.type === 'bill') Icon = CreditCard;

      return (
        <div className={`mention-suggestion ${focused ? 'focused' : ''} flex items-center p-2`}>
          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{highlightedDisplay}</span>
        </div>
      );
    };

    return (
      <div className="w-full">
        <ReactMentionsInput
          value={value}
          onChange={(e, newValue) => onChange(newValue)}
          placeholder={placeholder}
          disabled={disabled}
          className={`mentions-input min-h-[40px] ${className}`}
          inputRef={ref}
          onKeyDown={onKeyDown}
          a11ySuggestionsListLabel="Suggested mentions"
        >
          <Mention
            trigger="@"
            data={userData}
            markup="@[__display__](__id__)"
            displayTransform={(id, display) => `@${display}`}
            renderSuggestion={renderUserSuggestion}
            style={{ backgroundColor: 'hsl(var(--primary) / 0.2)', borderRadius: '2px', padding: '0 2px' }}
          />
          <Mention
            trigger="/"
            data={resourceData}
            markup="#[__display__](__id__)"
            displayTransform={(id, display) => ` #${display}`}
            renderSuggestion={renderResourceSuggestion}
            style={{ backgroundColor: 'hsl(var(--secondary))', borderRadius: '2px', padding: '0 2px', fontWeight: 500 }}
          />
        </ReactMentionsInput>
      </div>
    );
  }
);

export default MentionInput;