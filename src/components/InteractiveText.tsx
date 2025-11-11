import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';

interface InteractiveTextProps {
  text: string;
  members: User[];
}

const InteractiveText = ({ text, members }: InteractiveTextProps) => {
  if (!text) return null;

  // This regex will split the text by mentions, markdown bold, and URLs, keeping the delimiters.
  const regex = /(\*.*?\*|@\[[^\]]+\]\([a-f0-9-]+\)|https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(regex).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        // Check for Mention: @[DisplayName](uuid)
        const mentionMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
        if (mentionMatch) {
          const userId = mentionMatch[2];
          const user = members.find(m => m.id === userId);
          return user ? <UserMention key={index} user={user} /> : `@${mentionMatch[1]}`;
        }

        // Check for Bold: *text*
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={index}>{part.slice(1, -1)}</strong>;
        }

        // Check for URL
        if (part.match(/^(https?:\/\/[^\s]+|www\.[^\s]+)$/)) {
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

        // Plain text
        return part;
      })}
    </>
  );
};

export default InteractiveText;