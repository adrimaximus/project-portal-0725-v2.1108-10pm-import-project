import React from 'react';
import { MentionsInput as ReactMentionsInput, Mention } from 'react-mentions';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import '@/styles/mentions.css';

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

const MentionsInput = ({ value, onChange, users, className, placeholder, autoFocus, inputRef }: MentionsInputProps) => {
  const mentionData = users.map(user => ({
    id: user.id,
    display: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    initials: getInitials(user.name || user.email),
  }));

  return (
    <div className={className}>
      <ReactMentionsInput
        value={value}
        onChange={(e, newValue) => onChange(newValue)}
        placeholder={placeholder}
        className="mentions-input h-full"
        a11ySuggestionsListLabel={"Suggested mentions"}
        autoFocus={autoFocus}
        inputRef={inputRef}
      >
        <Mention
          trigger="@"
          data={mentionData}
          markup="@[__display__](__id__)"
          displayTransform={(id, display) => `@${display}`}
          renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => (
            <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                <AvatarFallback style={generatePastelColor(suggestion.id)}>
                  {suggestion.initials}
                </AvatarFallback>
              </Avatar>
              <div className="mention-suggestion-info">
                <div className="font-medium text-sm">{highlightedDisplay}</div>
                {suggestion.email && <div className="text-xs text-muted-foreground">{suggestion.email}</div>}
              </div>
            </div>
          )}
          style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: 500 }}
        />
      </ReactMentionsInput>
    </div>
  );
};

export default MentionsInput;