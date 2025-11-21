import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase, ListChecks, CreditCard } from 'lucide-react';
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

const MentionInput = forwardRef<HTMLTextAreaElement | HTMLInputElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, userSuggestions, projectSuggestions, taskSuggestions, billSuggestions, placeholder, disabled, className }, ref) => {
    
    // We need a local ref to expose focus/blur methods if needed, 
    // though react-mentions handles the internal ref. 
    // We'll assume parent might want to focus this.
    const mentionsRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => mentionsRef.current?.focus(),
      blur: () => mentionsRef.current?.blur(),
      // Mocking other textarea methods if necessary, or just exposing the underlying element
      ...mentionsRef.current
    }) as any);

    // Prepare data for react-mentions
    // Users: ID is the user ID. Display is the name.
    const userData = useMemo(() => {
      return userSuggestions.map(u => ({
        id: u.id,
        display: u.display,
        ...u
      }));
    }, [userSuggestions]);

    // Items (Projects, Tasks, Bills): ID is the URL. Display is the name.
    // We combine them for the '/' trigger.
    const itemData = useMemo(() => {
      const items: (SuggestionDataItem & { type: 'project' | 'task' | 'bill' })[] = [];

      projectSuggestions.forEach(p => {
        items.push({
          id: `/projects/${p.slug}`,
          display: p.display,
          type: 'project'
        });
      });

      taskSuggestions?.forEach(t => {
        items.push({
          id: `/projects/${t.project_slug}?tab=tasks&task=${t.id}`,
          display: t.display,
          type: 'task'
        });
      });

      billSuggestions?.forEach(b => {
        items.push({
          id: `/projects/${b.slug}?tab=billing`,
          display: b.display,
          type: 'bill'
        });
      });

      return items;
    }, [projectSuggestions, taskSuggestions, billSuggestions]);

    // Custom suggestion renderer
    const renderSuggestion = (suggestion: SuggestionDataItem, search: string, highlightedDisplay: React.ReactNode, index: number, focused: boolean) => {
      // Use the extended type from our data mapping
      const s = suggestion as any;
      
      const activeClass = focused ? "bg-accent text-accent-foreground" : "text-foreground";

      if (s.initials) {
        // User suggestion
        return (
          <div className={cn("flex items-center px-2 py-1.5 text-sm cursor-pointer select-none rounded-sm gap-2", activeClass)}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl(s.avatar_url, s.id)} />
              <AvatarFallback style={generatePastelColor(s.id)} className="text-[10px]">{s.initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{highlightedDisplay}</span>
              {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
            </div>
          </div>
        );
      } else {
        // Project/Task/Bill suggestion
        let Icon = Briefcase;
        if (s.type === 'task') Icon = ListChecks;
        if (s.type === 'bill') Icon = CreditCard;

        return (
          <div className={cn("flex items-center px-2 py-1.5 text-sm cursor-pointer select-none rounded-sm gap-2", activeClass)}>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{highlightedDisplay}</span>
          </div>
        );
      }
    };

    // Styles object for react-mentions to match shadcn/ui Textarea
    // Note: We use a container class for the outer box, and style overrides for the internals.
    const defaultStyle = {
      control: {
        fontSize: 14,
        lineHeight: 1.5,
      },
      highlighter: {
        overflow: 'hidden',
      },
      input: {
        margin: 0,
        overflow: 'auto',
      },
      suggestions: {
        list: {
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
          fontSize: 14,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          overflow: 'hidden',
          zIndex: 50,
        },
        item: {
          padding: 0, // Handled by renderSuggestion
          borderBottom: 'none',
          '&focused': {
            backgroundColor: 'transparent', // Handled by renderSuggestion
          },
        },
      },
    };

    return (
      <div className="relative w-full">
        <MentionsInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={defaultStyle}
          className={cn(
            "mentions-input min-h-[80px] w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
            // Custom CSS to force the textarea to fill the container and handle padding
            "[&_textarea]:p-3 [&_textarea]:bg-transparent [&_textarea]:text-foreground [&_textarea]:placeholder:text-muted-foreground [&_textarea]:outline-none",
            // Highlight overlay styling
            "[&_div]:p-3" 
          )}
          a11ySuggestionsListLabel={"Suggested mentions"}
          inputRef={mentionsRef}
        >
          {/* User Mentions: @[Name](id) */}
          <Mention
            trigger="@"
            data={userData}
            markup="@[__display__](__id__)"
            renderSuggestion={renderSuggestion}
            displayTransform={(id, display) => `@${display}`}
            className="bg-primary/10 text-primary font-semibold rounded-sm decoration-clone"
          />

          {/* Item Mentions: [Name](url) */}
          <Mention
            trigger="/"
            data={itemData}
            markup="[__display__](__id__)"
            renderSuggestion={renderSuggestion}
            displayTransform={(id, display) => display} // Just show the name, cleaner!
            className="text-blue-600 dark:text-blue-400 font-medium decoration-clone"
          />
        </MentionsInput>
      </div>
    );
  }
);

export default MentionInput;