import React from 'react';
import { MentionsInput as ReactMentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import './MentionsInput.css';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type MentionUser = {
  id: string;
  display_name: string;
  email?: string;
  handle?: string;
  avatar?: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  users: MentionUser[];
  placeholder?: string;
  onEnter?: () => void;
  inputClassName?: string;
  rows?: number;
};

const MentionsInput: React.FC<Props> = ({
  value,
  onChange,
  users,
  placeholder,
  onEnter,
  inputClassName,
  rows,
}) => {
  const mappedUsers = users.map(u => ({ id: u.id, display: u.display_name, avatar: u.avatar }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  const renderSuggestion = (
    suggestion: SuggestionDataItem,
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) => {
    const user = users.find(u => u.id === suggestion.id);
    return (
      <div className={`mentions__suggestions__item ${focused ? 'mentions__suggestions__item--focused' : ''}`}>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
          </Avatar>
          <span>{highlightedDisplay}</span>
        </div>
      </div>
    );
  };

  return (
    <ReactMentionsInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mentions"
      classNames={{
        control: cn(
          "w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        ),
        input: 'mentions__input',
        suggestions: {
          list: 'mentions__suggestions__list',
          item: '', // custom rendering handles this
          itemFocused: '',
        },
      }}
      rows={rows}
      onKeyDown={handleKeyDown}
      a11ySuggestionsListLabel={"Suggested mentions"}
    >
      <Mention
        trigger="@"
        data={mappedUsers}
        markup="@[__display__](__id__)"
        displayTransform={(id, display) => `@${display}`}
        renderSuggestion={renderSuggestion}
        style={{
          backgroundColor: 'hsl(var(--accent))',
          color: 'hsl(var(--accent-foreground))',
          fontWeight: '500',
          borderRadius: '4px',
          padding: '2px 4px',
        }}
      />
    </ReactMentionsInput>
  );
};

export default MentionsInput;