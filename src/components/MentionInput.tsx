import React, { useState, useMemo, useRef } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl, cn } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

export interface MentionSuggestion {
  id: string;
  display: string;
  avatar_url?: string;
  initials: string;
}

export interface CommandSuggestion {
  id: string;
  display: string;
  slug: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  mentionSuggestions: MentionSuggestion[];
  commandSuggestions: CommandSuggestion[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, mentionSuggestions, commandSuggestions, placeholder, disabled, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTrigger, setActiveTrigger] = useState<'@' | '/' | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const filteredSuggestions = useMemo(() => {
      if (!activeTrigger) return [];
      const suggestions = activeTrigger === '@' ? mentionSuggestions : commandSuggestions;
      if (!suggestions) return [];
      return suggestions.filter(s =>
        s.display.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [activeTrigger, searchTerm, mentionSuggestions, commandSuggestions]);

    const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          setActiveTrigger(null);
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
      
      const mentionMatch = textBeforeCursor.match(/@([\w\s]*)$/);
      const commandMatch = textBeforeCursor.match(/\/([\w\s]*)$/);

      if (mentionMatch) {
        setOpen(true);
        setActiveTrigger('@');
        setSearchTerm(mentionMatch[1]);
        setActiveIndex(0);
      } else if (commandMatch) {
        setOpen(true);
        setActiveTrigger('/');
        setSearchTerm(commandMatch[1]);
        setActiveIndex(0);
      } else {
        setOpen(false);
        setActiveTrigger(null);
      }
    };

    const handleSelect = (suggestion: MentionSuggestion | CommandSuggestion) => {
      if (!textareaRef.current || !activeTrigger) return;

      const text = value;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      
      const match = textBeforeCursor.match(new RegExp(`${activeTrigger}([\\w\\s]*)$`));
      if (!match) return;

      let replacementText = '';
      if (activeTrigger === '@') {
        const mention = suggestion as MentionSuggestion;
        replacementText = `@[${mention.display}](${mention.id}) `;
      } else if (activeTrigger === '/') {
        const command = suggestion as CommandSuggestion;
        replacementText = `[${command.display}](/projects/${command.slug}) `;
      }

      const startIndex = textBeforeCursor.lastIndexOf(activeTrigger);
      
      const newValue = 
        text.substring(0, startIndex) + 
        replacementText + 
        text.substring(cursorPos);

      onChange(newValue);
      setOpen(false);
      setActiveTrigger(null);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = startIndex + replacementText.length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    };

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const placeholderText = activeTrigger === '@' ? "Cari pengguna..." : "Cari proyek...";

    return (
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setActiveTrigger(null);
      }}>
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
              placeholder={placeholderText}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((suggestion, index) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
                    className={cn('cursor-pointer', index === activeIndex ? 'bg-accent' : '')}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {activeTrigger === '@' ? (
                      <>
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={getAvatarUrl((suggestion as MentionSuggestion).avatar_url, suggestion.id)} />
                          <AvatarFallback style={generatePastelColor(suggestion.id)}>{(suggestion as MentionSuggestion).initials}</AvatarFallback>
                        </Avatar>
                        <span>{suggestion.display}</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span>{suggestion.display}</span>
                      </>
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