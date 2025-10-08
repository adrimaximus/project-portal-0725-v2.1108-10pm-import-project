"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { RealtimeChannel } from '@supabase/supabase-js';

interface Collaborator {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
}

const OnlineCollaborators = ({ projectId }: { projectId: string }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Collaborator[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const { data: collaborators } = useQuery<Collaborator[]>({
    queryKey: ['project-collaborators', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('profiles(id, first_name, last_name, avatar_url)')
        .eq('project_id', projectId);

      if (error) throw error;

      return data.map((item: any) => {
        const profile = item.profiles;
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        return {
          id: profile.id,
          name: name || profile.email,
          avatar_url: profile.avatar_url,
          initials: (name ? (name.split(' ')[0][0] + (name.split(' ').length > 1 ? name.split(' ')[1][0] : '')) : profile.email[0]).toUpperCase(),
        };
      });
    },
  });

  useEffect(() => {
    if (!user || !projectId) return;

    const newChannel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = newChannel.presenceState();
        const userIds = Object.keys(presenceState).map(presenceId => presenceId);
        const online = collaborators?.filter(c => userIds.includes(c.id)) || [];
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await newChannel.track({ online_at: new Date().toISOString() });
        }
      });

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, projectId, collaborators]);

  const displayedCollaborators = onlineUsers.slice(0, 4);
  const remainingCount = onlineUsers.length > 4 ? onlineUsers.length - 4 : 0;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {displayedCollaborators.map((c) => (
          <Tooltip key={c.id}>
            <TooltipTrigger asChild>
              <div className="relative group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(c.avatar_url) || undefined} alt={c.name} />
                  <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{c.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-background bg-background">
                  <AvatarFallback>+{remainingCount}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center">
                  {onlineUsers.slice(4, 6).map((collaborator, index) => (
                    <div key={collaborator.id} className={`absolute ${index === 0 ? 'top-0 left-0' : 'bottom-0 right-0'}`}>
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={getAvatarUrl(collaborator.avatar_url) || undefined} alt={collaborator.name} />
                        <AvatarFallback style={{ backgroundColor: generatePastelColor(collaborator.id) }} className="text-xxs">{collaborator.initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more online</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default OnlineCollaborators;