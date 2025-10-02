import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';

interface CommentRendererProps {
  text: string;
  members: User[];
}

const CommentRenderer = ({ text, members }: CommentRendererProps) => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(mentionRegex);

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        // The display name is captured at index 1, 4, 7, etc.
        if (index % 3 === 1) {
          const userId = parts[index + 1];
          const user = members.find(m => m.id === userId);
          return user ? <UserMention key={index} user={user} /> : `@${part}`;
        }
        // The user ID is captured at index 2, 5, 8, etc. We skip rendering it.
        if (index % 3 === 2) {
          return null;
        }
        // Plain text parts are at index 0, 3, 6, etc.
        return part;
      })}
    </p>
  );
};

export default CommentRenderer;