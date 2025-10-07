import { useState, useRef, useEffect, useMemo } from 'react';
import { Mention, MentionsInput, SuggestionDataItem } from 'react-mentions';
import { useProfiles } from '@/hooks/useProfiles';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSend?: () => void;
}

interface UserSuggestion extends SuggestionDataItem {
  name: string;
  avatar_url: string;
  initials: string;
  role: string;
}

const MentionInput = ({ value, onChange, placeholder, onSend }: MentionInputProps) => {
  const { data: profiles = [], isLoading } = useProfiles();
  const [isFocused, setIsFocused] = useState(false);
  const mentionsInputRef = useRef<any>(null);

  const userSuggestions: UserSuggestion[] = useMemo(() => {
    return profiles.map(p => ({
      id: p.id,
      display: p.name,
      name: p.name,
      avatar_url: p.avatar_url,
      initials: p.initials,
      role: p.role || 'Member',
    }));
  }, [profiles]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && onSend) {
      event.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (mentionsInputRef.current) {
      const textarea = mentionsInputRef.current.inputEl as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [value]);

  const renderSuggestion = (
    suggestion: SuggestionDataItem,
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ): React.ReactNode => {
    const userSuggestion = suggestion as UserSuggestion;
    return (
      <div className={`flex items-center p-2 ${focused ? 'bg-muted' : ''}`}>
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={userSuggestion.avatar_url} />
          <AvatarFallback style={generatePastelColor(userSuggestion.id)}>{userSuggestion.initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{highlightedDisplay}</div>
          <div className="text-xs text-muted-foreground flex items-center">
            <Briefcase className="h-3 w-3 mr-1" />
            {userSuggestion.role}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative transition-all duration-300 ease-in-out border rounded-lg ${isFocused ? 'border-primary' : 'border-input'}`}
      onClick={() => mentionsInputRef.current?.inputEl?.focus()}
    >
      <MentionsInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        inputRef={mentionsInputRef}
        className="mentions"
        style={{
          control: {
            backgroundColor: 'transparent',
            fontSize: '14px',
            fontWeight: 'normal',
            border: 'none',
            boxShadow: 'none',
          },
          input: {
            margin: '0px',
            padding: '10px 12px',
            overflow: 'auto',
            height: 'auto',
            maxHeight: '150px',
            outline: 'none',
            resize: 'none',
          },
          suggestions: {
            list: {
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: 14,
              maxHeight: '250px',
              overflowY: 'auto',
              marginTop: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            item: {
              '&focused': {
                backgroundColor: 'hsl(var(--muted))',
              },
            },
          },
        }}
      >
        <Mention
          trigger="@"
          data={userSuggestions}
          renderSuggestion={renderSuggestion}
          displayTransform={(id, display) => `@${display}`}
          markup="@[__display__](__id__)"
          appendSpaceOnAdd
        />
      </MentionsInput>
    </div>
  );
};

export default MentionInput;