import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase, ListChecks, CreditCard } from 'lucide-react';
import '@/styles/mentions.css';
import { cn } from '@/lib/utils';

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
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) => void;
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
    const mentionsRef = useRef<any>(null);

    // Expose the textarea DOM node to the parent ref
    useImperativeHandle(ref, () => mentionsRef.current?.inputElement || mentionsRef.current);

    const handleUsersSearch = (query: string, callback: (data: any[]) => void) => {
       const term = query.toLowerCase();
       const filtered = (userSuggestions || []).filter(u => u.display.toLowerCase().includes(term)).map(u => ({
         id: u.id,
         display: u.display,
         ...u
       }));
       callback(filtered);
    };

    const handleResourcesSearch = (query: string, callback: (data: any[]) => void) => {
       const term = query.toLowerCase();
       const projects = (projectSuggestions || []).filter(s => s.display.toLowerCase().includes(term)).map(s => ({ id: `project:${s.slug}`, display: s.display, icon: Briefcase }));
       const tasks = (taskSuggestions || []).filter(s => s.display.toLowerCase().includes(term)).map(s => ({ id: `task:${s.project_slug}:${s.id}`, display: s.display, icon: ListChecks }));
       const bills = (billSuggestions || []).filter(s => s.display.toLowerCase().includes(term)).map(s => ({ id: `bill:${s.slug}`, display: s.display, icon: CreditCard }));
       
       callback([...projects, ...tasks, ...bills]);
    };

    return (
        <div className={cn("relative w-full", className)}>
            <MentionsInput
                value={value}
                onChange={(e, newValue, newPlainTextValue, mentions) => onChange(newValue)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="mentions-input"
                disabled={disabled}
                inputRef={mentionsRef}
                a11ySuggestionsListLabel={"Suggested mentions"}
                allowSuggestionsAboveCursor={true}
                forceSuggestionsAboveCursor={true} // Often better for chat inputs at bottom of screen
            >
                <Mention
                    trigger="@"
                    data={handleUsersSearch}
                    markup="@[__display__](__id__)"
                    displayTransform={(id, display) => `@${display}`}
                    className="mentions-input__mention"
                    renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => (
                        <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
                             <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                                <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
                             </Avatar>
                             <div>
                                <div className="font-medium text-sm">{highlightedDisplay}</div>
                                <div className="text-xs text-muted-foreground">{suggestion.email}</div>
                             </div>
                        </div>
                    )}
                />
                <Mention
                    trigger="/"
                    data={handleResourcesSearch}
                    markup="#[__display__](__id__)"
                    displayTransform={(id, display) => `#${display}`}
                     style={{
                        backgroundColor: 'hsl(var(--secondary))',
                        color: 'hsl(var(--secondary-foreground))',
                        fontWeight: 500,
                        padding: '0 1px',
                        borderRadius: '2px'
                     }}
                    renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => {
                        const Icon = suggestion.icon;
                        return (
                            <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
                                <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <div className="font-medium text-sm">{highlightedDisplay}</div>
                            </div>
                        );
                    }}
                />
            </MentionsInput>
        </div>
    );
  }
);

export default MentionInput;