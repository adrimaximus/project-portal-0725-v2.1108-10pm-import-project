import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';

interface InteractiveTextProps {
  text: string;
  members: User[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, members }) => {
  if (!text) return null;

  // Regex to find mentions: @[Display Name](uuid)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Regex to find URLs: http(s)://... 
  // Uses [^\s]+ to capture the full token initially. We will refine it in the loop.
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combine regex for mentions and URLs to process in one pass
  const combinedRegex = new RegExp(`(${mentionRegex.source})|(${urlRegex.source})`, 'g');

  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = combinedRegex.lastIndex;

    // Add preceding plain text
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Check if it's a mention (group 1 is for mention, group 4 is for URL wrapper)
    // Group indices:
    // 1: Full mention match
    // 2: Display Name
    // 3: UUID
    // 4: Full URL match wrapper
    
    if (match[1]) { // This means it's a mention
      const displayName = match[2];
      const userId = match[3];
      const mentionedUser = members.find(m => m.id === userId);

      if (mentionedUser) {
        parts.push(
          <Link 
            key={`mention-${startIndex}`} 
            to={`/users/${mentionedUser.id}`} 
            className="text-primary bg-primary/10 hover:bg-primary/20 rounded-md px-1.5 py-0.5 font-medium transition-colors no-underline"
          >
            @{displayName}
          </Link>
        );
      } else {
        parts.push(
            <span 
                key={`mention-${startIndex}`} 
                className="text-primary/70 bg-primary/5 rounded-md px-1.5 py-0.5 font-medium"
            >
                @{displayName}
            </span>
        );
      }
    } else if (match[4]) { // This means it's a URL
      let url = match[4];
      let suffix = "";

      // Smartly strip trailing punctuation that isn't part of the URL
      // Iterate backwards to peel off punctuation
      while (url.length > 0) {
        const lastChar = url[url.length - 1];
        
        // Check for common sentence punctuation
        if (/[.,;:!?]/.test(lastChar)) {
          url = url.slice(0, -1);
          suffix = lastChar + suffix;
        } 
        // Special handling for closing parenthesis
        else if (lastChar === ')') {
          const openCount = (url.match(/\(/g) || []).length;
          const closeCount = (url.match(/\)/g) || []).length;
          
          // If we have more closing parens than opening, this one is likely a wrapper
          if (closeCount > openCount) {
             url = url.slice(0, -1);
             suffix = lastChar + suffix;
          } else {
             // Balanced or more open, so this ')' is probably part of the URL
             break;
          }
        } else {
          // Valid URL character found at end
          break;
        }
      }

      parts.push(
        <a key={`url-${startIndex}`} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {url}
        </a>
      );
      if (suffix) {
        parts.push(suffix);
      }
    }
    lastIndex = endIndex;
  }

  // Add any remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

export default InteractiveText;