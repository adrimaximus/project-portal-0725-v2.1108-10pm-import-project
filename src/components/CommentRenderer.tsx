import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';
import { MENTION_RE } from '@/lib/mention-utils';

interface CommentRendererProps {
  text: string;
  members: User[];
}

const CommentRenderer = ({ text, members }: CommentRendererProps) => {
  if (!text) return null;

  const parts = text.split(MENTION_RE);

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (i % 3 === 1) { // This is the name
          const id = parts[i + 1];
          const user = members.find(m => m.id === id);
          return user 
            ? <UserMention key={`${id}-${i}`} user={user} /> 
            : <span key={`${id}-${i}`} className="font-semibold text-mention">@{part}</span>;
        }
        if (i % 3 === 2) { // This is the id, we skip it
          return null;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
};

export default CommentRenderer;