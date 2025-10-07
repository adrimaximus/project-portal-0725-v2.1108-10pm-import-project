import { useState, useRef, useEffect } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { Mention, MentionsInput } from "react-mentions";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface CommentInputProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

const CommentInput = ({ onSubmit, isSubmitting }: CommentInputProps) => {
  const [text, setText] = useState('');
  const { data: profiles = [] } = useProfiles();
  const mentionsInputRef = useRef<any>(null);

  const userSuggestions = profiles.map(p => ({
    id: p.id,
    display: p.name,
    name: p.name,
    avatar_url: p.avatar_url,
    initials: p.initials,
  }));

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
  }, [text]);

  return (
    <div className="flex items-start gap-3">
      <div className="flex-grow">
        <MentionsInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment... @ to mention"
          onKeyDown={handleKeyDown}
          inputRef={mentionsInputRef}
          className="mentions"
          style={{
            control: {
              backgroundColor: 'hsl(var(--input))',
              fontSize: '14px',
              fontWeight: 'normal',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
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
                padding: '5px 15px',
                borderBottom: '1px solid hsl(var(--border))',
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
            renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
              <div className={`flex items-center p-2 ${focused ? 'bg-muted' : ''}`}>
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={getAvatarUrl(suggestion)} />
                  <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{highlightedDisplay}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.name}</div>
                </div>
              </div>
            )}
            displayTransform={(id, display) => `@${display}`}
            markup="@[__display__](__id__)"
            appendSpaceOnAdd
          />
        </MentionsInput>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting || !text.trim()} size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CommentInput;