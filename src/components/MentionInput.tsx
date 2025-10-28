import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

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

type Suggestion = UserSuggestion | ProjectSuggestion;

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  userSuggestions: UserSuggestion[];
  projectSuggestions: ProjectSuggestion[];
  onSearchTermChange?: (trigger: '@' | '/' | null, term: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, userSuggestions, projectSuggestions, onSearchTermChange, placeholder, disabled, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTrigger, setActiveTrigger] = useState<'@' | '/' | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = activeTrigger === '@' ? userSuggestions : projectSuggestions;
    const filteredSuggestions = suggestions || [];

    const handleSearchChange = (newSearchTerm: string) => {
      setSearchTerm(newSearchTerm);
      if (onSearchTermChange && activeTrigger) {
        onSearchTermChange(activeTrigger, newSearchTerm);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (open && filteredSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          handleSelect(filteredSuggestions[activeIndex]);
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        }
      }
      
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

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
        setActiveTrigger(trigger);
        setActiveIndex(0);
        handleSearchChange(term);
      } else {
        setOpen(false);
        setActiveTrigger(null);
        if (onSearchTermChange) {
          onSearchTermChange(null, '');
        }
      }
    };

    const handleSelect = (suggestion: Suggestion) => {
      if (!textareaRef.current) return;

      const text = value;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      
      const match = textBeforeCursor.match(/([@\/])([\w\s-]*)$/);
      if (!match) return;

      let mentionText = '';
      if (activeTrigger === '@') {
        const user = suggestion as UserSuggestion;
        mentionText = `@[${user.display}](${user.id}) `;
      } else if (activeTrigger === '/') {
        const proj = suggestion as ProjectSuggestion;
        mentionText = `[${proj.display}](/projects/${proj.slug}) `;
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
      if (onSearchTermChange) {
        onSearchTermChange(null, '');
      }

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = startIndex + mentionText.length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    };

    React.useImperativeHandle(ref, () => textareaRef.current!);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
          />
        </PopoverAnchor>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={activeTrigger === '@' ? "Search user..." : "Search project..."}
              value={searchTerm}
              onValueChange={handleSearchChange}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((suggestion, index) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
                    className={index === activeIndex ? 'bg-accent' : ''}
                  >
                    {activeTrigger === '@' ? (
                      <>
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={getAvatarUrl((suggestion as UserSuggestion).avatar_url, suggestion.id)} />
                          <AvatarFallback style={generatePastelColor(suggestion.id)}>{(suggestion as UserSuggestion).initials}</AvatarFallback>
                        </Avatar>
                        <span>{suggestion.display}</span>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{suggestion.display}</span>
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

export default MentionInput;