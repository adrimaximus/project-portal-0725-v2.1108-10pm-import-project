import React from 'react';
import { Link } from 'react-router-dom';
import { Collaborator } from '@/types';

interface InteractiveTextProps {
  text: string;
  members?: Collaborator[];
}

const InteractiveText = ({ text, members = [] }: InteractiveTextProps) => {
  if (!text) return null;

  // Regex logic:
  // 1. Mentions: @[Name](id)
  // 2. Markdown Links: [Text](url)
  // 3. Raw URLs: http://... or https://...
  // 4. Newlines
  
  const parts = text.split(/(@\[[^\]]+\]\s*\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|\n)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part === '\n') {
          return <br key={i} />;
        }

        // Mention: @[Name](id)
        const mentionMatch = part.match(/^@\[([^\]]+)\]\s*\(([^)]+)\)$/);
        if (mentionMatch) {
          const name = mentionMatch[1];
          // Optional: Could link to user profile if needed using ID
          return (
            <span key={i} className="text-blue-500 font-medium">
              @{name}
            </span>
          );
        }

        // Markdown Link: [Text](Url)
        const mdLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (mdLinkMatch) {
          const label = mdLinkMatch[1];
          let url = mdLinkMatch[2];
          
          // Handle custom 'task:' protocol seen in screenshot
          // Format seems to be task:project-slug:task-id
          if (url.startsWith('task:')) {
             const segments = url.split(':');
             // task:slug:id
             if (segments.length >= 3) {
                 const slug = segments[1];
                 const taskId = segments[2];
                 url = `/projects/${slug}?tab=tasks&task=${taskId}`;
             }
          }

          const isInternal = url.startsWith('/');
          
          if (isInternal) {
            return (
              <Link key={i} to={url} className="text-blue-500 hover:underline break-words">
                {label}
              </Link>
            );
          }
          
          return (
            <a 
              key={i} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline break-words"
            >
              {label}
            </a>
          );
        }

        // Raw URL
        if (part.match(/^https?:\/\//)) {
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline break-words"
            >
              {part}
            </a>
          );
        }

        // Plain text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default InteractiveText;