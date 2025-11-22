import React from 'react';
import { Link } from 'react-router-dom';
import { Collaborator } from '@/types';

interface InteractiveTextProps {
  text: string | null | undefined;
  members?: Collaborator[];
}

const InteractiveText = ({ text, members = [] }: InteractiveTextProps) => {
  if (!text) return null;

  // Regex logic:
  // 1. Mentions: @[Name](id)
  // 2. Markdown Links: [Text](url)
  // 3. Bold: **text**
  // 4. Italic: *text*
  // 5. Raw URLs: http://... or https://...
  // 6. Newlines
  
  // Complex regex to split by all these tokens while keeping delimiters
  const parts = text.split(/(@\[[^\]]+\]\s*\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+|\n)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part === '\n') {
          return <br key={i} />;
        }

        // Bold: **text**
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
        if (boldMatch) {
          return <strong key={i} className="font-bold">{boldMatch[1]}</strong>;
        }

        // Italic: *text*
        const italicMatch = part.match(/^\*([^*]+)\*$/);
        if (italicMatch) {
          return <em key={i} className="italic">{italicMatch[1]}</em>;
        }

        // Mention: @[Name](id)
        const mentionMatch = part.match(/^@\[([^\]]+)\]\s*\(([^)]+)\)$/);
        if (mentionMatch) {
          const name = mentionMatch[1];
          return (
            <span key={i} className="font-bold hover:underline cursor-pointer text-primary">
              @{name}
            </span>
          );
        }

        // Markdown Link: [Text](Url)
        const mdLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (mdLinkMatch) {
          const label = mdLinkMatch[1];
          let url = mdLinkMatch[2];
          
          // Handle custom 'task:' protocol
          if (url.startsWith('task:')) {
             const segments = url.split(':');
             if (segments.length >= 3) {
                 const slug = segments[1];
                 const taskId = segments[2];
                 url = `/projects/${slug}?tab=tasks&task=${taskId}`;
             }
          }

          const isInternal = url.startsWith('/');
          
          if (isInternal) {
            return (
              <Link key={i} to={url} className="underline hover:opacity-80 break-words text-primary">
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
              className="underline hover:opacity-80 break-words text-primary"
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
              className="underline hover:opacity-80 break-words text-primary"
            >
              {part}
            </a>
          );
        }

        // Plain text
        return <span key={i} className="break-words">{part}</span>;
      })}
    </>
  );
};

export default InteractiveText;