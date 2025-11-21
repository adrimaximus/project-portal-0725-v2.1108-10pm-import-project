import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase, ListChecks, CreditCard } from 'lucide-react';

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

type Suggestion = UserSuggestion | ProjectSuggestion | TaskSuggestion | BillSuggestion;

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTrigger, setActiveTrigger] = useState<'@' | '/' | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const { filteredUserSuggestions, filteredProjectSuggestions, filteredTaskSuggestions, filteredBillSuggestions } = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return {
            filteredUserSuggestions: (userSuggestions || []).filter(s => s.display.toLowerCase().includes(term)),
            filteredProjectSuggestions: (projectSuggestions || []).filter(s => s.display.toLowerCase().includes(term)),
            filteredTaskSuggestions: (taskSuggestions || []).filter(s => s.display.toLowerCase().includes(term)),
            filteredBillSuggestions: (billSuggestions || []).filter(s => s.display.toLowerCase().includes(term)),
        };
    }, [userSuggestions, projectSuggestions, taskSuggestions, billSuggestions, searchTerm]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      onChange(text);

      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      const match = textBeforeCursor.match(/([@\/])([\w\s-]*)$/);

      if (match) {
        const trigger = match[1] as '@' | '/';
        const term = match[2];
        setOpen(true);
        setSearchTerm(term);
        setActiveTrigger(trigger);
      } else {
        setOpen(false);
        setActiveTrigger(null);
      }
    };

    const handleSelect = (suggestion: Suggestion, type: 'user' | 'project' | 'task' | 'bill') => {
      if (!textareaRef.current) return;

      const text = value;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      
      const match = textBeforeCursor.match(/([@\/])([\w\s-]*)$/);
      if (!match) return;

      let mentionText = '';
      if (type === 'user') {
        const user = suggestion as UserSuggestion;
        mentionText = `@[${user.display}](${user.id}) `;
      } else if (type === 'project') {
        const proj = suggestion as ProjectSuggestion;
        // Cleaner shortcode: #[Display](project:slug)
        mentionText = `#[${proj.display}](project:${proj.slug}) `;
      } else if (type === 'task') {
        const task = suggestion as TaskSuggestion;
        // Cleaner shortcode: #[Display](task:project_slug:task_id)
        mentionText = `#[${task.display}](task:${task.project_slug}:${task.id}) `;
      } else if (type === 'bill') {
        const bill = suggestion as BillSuggestion;
        // Cleaner shortcode: #[Display](bill:slug)
        mentionText = `#[${bill.display}](bill:${bill.slug}) `;
      }
      
      const startIndex = match.index!;
      
      const newValue = 
        text.substring(0, startIndex) + 
        mentionText + 
        text.substring(cursorPos);

      onChange(newValue);
      setOpen(false);
      setSearchTerm('');
      setActiveTrigger(null);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = startIndex + mentionText.length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    };

    const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (open && (e.key === 'Enter' || e.key === 'Tab')) {
        // Let cmdk handle the selection via onSelect, but prevent form submission.
        e.preventDefault();
      } else if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleLocalKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
          />
        </PopoverAnchor>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={activeTrigger === '@' ? "Search user..." : "Search project, task, or bill..."}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {activeTrigger === '@' && filteredUserSuggestions.length > 0 && (
                <CommandGroup>
                  {filteredUserSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSelect(suggestion, 'user')}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                        <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestion.display}</span>
                        <span className="text-xs text-muted-foreground">{suggestion.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {activeTrigger === '/' && (
                <>
                  {filteredProjectSuggestions.length > 0 && (
                    <CommandGroup heading="Projects">
                      {filteredProjectSuggestions.map((suggestion) => (
                        <CommandItem key={suggestion.id} onSelect={() => handleSelect(suggestion, 'project')}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>{suggestion.display}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {filteredTaskSuggestions && filteredTaskSuggestions.length > 0 && (
                    <CommandGroup heading="Tasks">
                      {filteredTaskSuggestions.map((suggestion) => (
                        <CommandItem key={suggestion.id} onSelect={() => handleSelect(suggestion, 'task')}>
                          <ListChecks className="mr-2 h-4 w-4" />
                          <span>{suggestion.display}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {filteredBillSuggestions && filteredBillSuggestions.length > 0 && (
                    <CommandGroup heading="Bills">
                      {filteredBillSuggestions.map((suggestion) => (
                        <CommandItem key={suggestion.id} onSelect={() => handleSelect(suggestion, 'bill')}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>{suggestion.display}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

export default MentionInput;