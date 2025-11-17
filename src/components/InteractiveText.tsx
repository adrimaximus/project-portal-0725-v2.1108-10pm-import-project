import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, getInitials, generatePastelColor } from '@/lib/utils';

interface InteractiveTextProps {
  text: string;
  members?: User[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, members = [] }) => {
  if (!text) {
    return null;
  }

  // Regex to find mentions in the format @[DisplayName](uuid)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        // The parts array will be structured like: [text, displayName, userId, text, ...]
        // So, the displayName is at index 1, 4, 7, ... (i.e., index % 3 === 1)
        if (index > 0 && index % 3 === 1) {
          const displayName = part;
          const userId = parts[index + 1];
          const member = members.find(m => m.id === userId);

          if (member) {
            const memberName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
            return (
              <TooltipProvider key={index} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-primary font-semibold bg-primary/10 px-1 rounded cursor-pointer">
                      @{displayName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
                        <AvatarFallback style={generatePastelColor(member.id)}>
                          {getInitials(memberName || '', member.email || undefined)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{memberName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          // Fallback if member is not found in the provided list
          return (
            <span key={index} className="text-primary font-semibold bg-primary/10 px-1 rounded">
              @{displayName}
            </span>
          );
        }
        
        // This is the userId part, which we've already processed with the displayName. Skip it.
        if (index > 0 && index % 3 === 2) {
          return null;
        }

        // This is a regular text part.
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default InteractiveText;