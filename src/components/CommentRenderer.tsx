import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';

interface CommentRendererProps {
  text: string;
  members: User[];
}

const CommentRenderer = ({ text, members }: CommentRendererProps) => {
  // Regex to find markdown-style mentions like @[DisplayName](userId)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  // Combine regexes to split the text by both mentions and URLs
  const combinedRegex = new RegExp(`(${mentionRegex.source}|${urlRegex.source})`, 'g');
  const parts = text.split(combinedRegex);

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (!part) return null;

        // Check if the part is a mention
        const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
        if (mentionMatch) {
          const [, displayName, userId] = mentionMatch;
          const user = members.find(m => m.id === userId);
          // If user is found, render UserMention, otherwise render the display name as text
          return user ? <UserMention key={index} user={user} /> : `@${displayName}`;
        }

        // Check if the part is a URL
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {part}
            </a>
          );
        }

        // Otherwise, it's plain text
        return part;
      })}
    </p>
  );
};

export default CommentRenderer;