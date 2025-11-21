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
  // 2. Resource Mentions (Projects/Tasks/Bills): #[Name](type:id...)
  // 3. Markdown Links: [Label](url)
  // Note: We use a capturing group to include the delimiters in the split result
  const regex = /([@#]?\[[^\]]+\]\([^)]+\))/g;
  
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // 1. User Mention: @[Name](id)
        const userMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
        if (userMatch) {
          const [, name, id] = userMatch;
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

        // 2. Resource Mention: #[Name](type:data)
        const resourceMatch = part.match(/^#\[([^\]]+)\]\(([^)]+)\)$/);
        if (resourceMatch) {
          const [, label, info] = resourceMatch;
          // Split only on the first few colons to avoid breaking if data contains colons (though UUIDs don't)
          // task:slug:id
          const parts = info.split(':');
          const type = parts[0];
          const data = parts.slice(1);
          
          let url = '#';

          // Construct URL based on type
          if (type === 'project' && data.length > 0) {
             // Format: project:slug
             url = `/projects/${data[0]}`;
          } else if (type === 'task' && data.length >= 2) {
             // Format: task:project_slug:task_id
             url = `/projects/${data[0]}?tab=tasks&task=${data[1]}`;
          } else if (type === 'bill' && data.length > 0) {
             // Format: bill:slug
             url = `/projects/${data[0]}?tab=billing`;
          }
          
          return (
             <Link 
                key={index} 
                to={url} 
                className="text-primary underline decoration-primary/50 underline-offset-2 font-medium cursor-pointer transition-opacity hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </Link>
          );
        }

        // 3. Markdown Link: [Label](url) - Fallback/Legacy
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          const isInternal = url.startsWith('/');
          const classes = "text-primary underline decoration-primary/50 underline-offset-2 font-medium cursor-pointer transition-opacity hover:opacity-80";

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

        // 4. Plain Text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default InteractiveText;