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

  // Regex untuk menemukan sebutan dalam format @[DisplayName](uuid) atau @[DisplayName] (uuid)
  const mentionRegex = /@\[([^\]]+)\]\s*\(([^)]+)\)/g;
  const parts = text.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        // Array bagian akan terstruktur seperti: [teks, displayName, userId, teks, ...]
        // Jadi, displayName ada di indeks 1, 4, 7, ... (yaitu, indeks % 3 === 1)
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
          // Fallback jika anggota tidak ditemukan dalam daftar yang disediakan
          return (
            <span key={index} className="text-primary font-semibold bg-primary/10 px-1 rounded">
              @{displayName}
            </span>
          );
        }
        
        // Ini adalah bagian userId, yang sudah kita proses dengan displayName. Lewati.
        if (index > 0 && index % 3 === 2) {
          return null;
        }

        // Ini adalah bagian teks biasa.
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default InteractiveText;