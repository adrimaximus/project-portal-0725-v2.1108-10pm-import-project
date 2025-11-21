import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';

interface InteractiveTextProps {
  text: string;
  members?: User[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, members = [] }) => {
  if (!text) return null;

  // Regex to match:
  // 1. User Mentions: @[Name](id)
  // 2. Markdown Links: [Label](url)
  // Capturing the full match to preserve it during split
  const regex = /(@?\[[^\]]+\]\([^)]+\))/g;
  
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // 1. User Mention: @[Name](id)
        if (part.startsWith('@[')) {
          const match = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const [, name, id] = match;
            const member = members.find((m) => m.id === id);
            return (
              <span key={index} className="bg-primary/10 text-primary font-semibold rounded px-1 py-0.5 inline-flex items-center gap-1 align-middle text-xs mx-0.5">
                {member && (
                  <Avatar className="h-3.5 w-3.5">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className="text-[6px]">{getInitials(member.name || name)}</AvatarFallback>
                  </Avatar>
                )}
                @{name}
              </span>
            );
          }
        }

        // 2. Markdown Link: [Label](url)
        if (part.startsWith('[')) {
          const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const [, label, url] = match;
            const isInternal = url.startsWith('/');
            const classes = "text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer";

            if (isInternal) {
              return (
                <Link 
                  key={index} 
                  to={url} 
                  className={classes}
                  onClick={(e) => e.stopPropagation()}
                >
                  {label}
                </Link>
              );
            }
            return (
              <a 
                key={index} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={classes}
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </a>
            );
          }
        }

        // 3. Plain Text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default InteractiveText;