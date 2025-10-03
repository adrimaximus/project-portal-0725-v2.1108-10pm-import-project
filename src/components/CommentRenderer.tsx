import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';

interface CommentRendererProps {
  text: string;
  members: User[];
}

const CommentRenderer = ({ text, members }: CommentRendererProps) => {
  // Sort members by name length, descending, to match longer names first (e.g., "Adri Maximus" before "Adri")
  const sortedMembers = [...members].sort((a, b) => b.name.length - a.name.length);
  
  // Create a regex pattern from member names to accurately find mentions
  const mentionPattern = sortedMembers.map(m => m.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  
  // This regex will find `@` followed by one of the member names, ensuring it's not part of an email
  const regex = new RegExp(`(?<!\\S)@(${mentionPattern})(?!\\S)`, 'g');
  
  const parts = text.split(regex);
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        // Matched names are at odd indices
        if (index % 2 === 1) {
          const user = members.find(m => m.name === part);
          return user ? <UserMention key={index} user={user} /> : `@${part}`;
        }

        // Plain text parts are at even indices, check for URLs in them
        const textParts = part.split(urlRegex);
        return textParts.map((textPart, i) => {
          if (textPart.match(urlRegex)) {
            const href = textPart.startsWith('www.') ? `https://${textPart}` : textPart;
            return (
              <a
                key={`${index}-${i}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                {textPart}
              </a>
            );
          }
          return textPart;
        });
      })}
    </p>
  );
};

export default CommentRenderer;