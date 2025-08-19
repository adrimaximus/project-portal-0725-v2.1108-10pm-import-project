import React from 'react';
import UserMention from './UserMention';
import { User } from '@/types';

interface CommentRendererProps {
  text: string;
  members: User[];
}

const CommentRenderer = ({ text, members }: CommentRendererProps) => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  if (!text) return null;

  const matches = Array.from(text.matchAll(mentionRegex));
  
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{text}</p>;
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    const [fullMatch, displayName, userId] = match;
    const startIndex = match.index!;

    // Add text before the mention
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Add the mention component
    const user = members.find(m => m.id === userId);
    parts.push(
      user 
        ? <UserMention key={`${userId}-${i}`} user={user} /> 
        : <span key={`${userId}-${i}`} className="font-semibold text-mention">{`@${displayName}`}</span>
    );

    lastIndex = startIndex + fullMatch.length;
  });

  // Add any remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {parts.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </p>
  );
};

export default CommentRenderer;