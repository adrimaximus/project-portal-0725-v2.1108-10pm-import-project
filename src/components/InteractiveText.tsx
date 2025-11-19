import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types'; // Assuming User type is available and has 'id'

interface InteractiveTextProps {
  text: string;
  members: User[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, members }) => {
  if (!text) return null;

  // Regex to find mentions: @[Display Name](uuid)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  // Regex to find URLs: http(s)://...
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combine regex for mentions and URLs to process in one pass
  // This regex will capture either a mention or a URL
  const combinedRegex = new RegExp(`(${mentionRegex.source})|(${urlRegex.source})`, 'g');

  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = combinedRegex.lastIndex;

    // Add preceding plain text
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Check if it's a mention (group 1 is for mention, group 4 is for URL)
    if (match[1]) { // This means it's a mention
      const displayName = match[2];
      const userId = match[3];
      const mentionedUser = members.find(m => m.id === userId);

      if (mentionedUser) {
        // Link to a generic user profile page using ID
        // Updated styling to use theme primary colors: text-primary with bg-primary/10
        parts.push(
          <Link 
            key={`mention-${startIndex}`} 
            to={`/profile/${mentionedUser.id}`} 
            className="text-primary bg-primary/10 hover:bg-primary/20 rounded-md px-1.5 py-0.5 font-medium transition-colors no-underline"
          >
            @{displayName}
          </Link>
        );
      } else {
        // Unlinked mention styling to match theme
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
      const url = match[4];
      // URL link with theme-neutral styling
      parts.push(
        <a key={`url-${startIndex}`} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {url}
        </a>
      );
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