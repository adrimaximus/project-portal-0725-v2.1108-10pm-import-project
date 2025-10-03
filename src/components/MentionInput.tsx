import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

export interface MentionSuggestion {
  id: string;
  display: string;
  avatar_url?: string;
  initials: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  suggestions: MentionSuggestion[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(
  ({ value, onChange, onKeyDown, suggestions, placeholder, disabled, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const filteredSuggestions = suggestions.filter(s =>
      s.display.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
          return; // Prevent default form submission
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
      const atMatch = textBeforeCursor.match(/@(\w*)$/);

      if (atMatch) {
        setOpen(true);
        setSearchTerm(atMatch[1]);
        setActiveIndex(0);
      } else {
        setOpen(false);
      }
    };

    const handleSelect = (suggestion: MentionSuggestion) => {
      if (!textareaRef.current) return;

      const text = value;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      
      const atMatch = textBeforeCursor.match(/@(\w*)$/);
      if (!atMatch) return;

      const mentionText = `@[${suggestion.display}](${suggestion.id}) `;
      const startIndex = textBeforeCursor.lastIndexOf('@');
      
      const newValue = 
        text.substring(0, startIndex) + 
        mentionText + 
        text.substring(cursorPos);

      onChange(newValue);
      setOpen(false);

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
            onKeyDown={handleLocalKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
          />
        </PopoverAnchor>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search user..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((suggestion, index) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
                    className={index === activeIndex ? 'bg-accent' : ''}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                      <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
                    </Avatar>
                    <span>{suggestion.display}</span>
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