"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

const OnlineCollaborators = ({ projectId, isCollapsed }: { projectId?: string, isCollapsed: boolean }) => {
  const { user, onlineCollaborators: workspaceCollaborators } = useAuth();
  const [onlineProjectCollaborators, setOnlineProjectCollaborators] = useState<Collaborator[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const { data: projectCollaborators } = useQuery<Collaborator[]>({
    queryKey: ['project-collaborators', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_members')
        .select('profiles(id, first_name, last_name, avatar_url, email)')
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
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!user || !projectId) return;

    const newChannel = supabase.channel(`project:${projectId}`, {
      config: { presence: { key: user.id } },
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = newChannel.presenceState();
        const userIds = Object.keys(presenceState);
        const online = projectCollaborators?.filter(c => userIds.includes(c.id)) || [];
        setOnlineProjectCollaborators(online);
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
  }, [user, projectId, projectCollaborators]);

  const onlineUsers = projectId ? onlineProjectCollaborators : workspaceCollaborators;

  const displayedCollaborators = onlineUsers.slice(0, 4);
  const remainingCount = onlineUsers.length > 4 ? onlineUsers.length - 4 : 0;

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        {displayedCollaborators.map((c) => (
          <TooltipProvider key={c.id}>
            <Tooltip>
              <TooltipTrigger>
                <div className="relative group">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.avatar_url) || undefined} alt={c.name} />
                    <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-background" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{c.name}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-muted-foreground mb-2">ONLINE</h3>
      <div className="flex flex-col gap-2">
        {onlineUsers.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(c.avatar_url) || undefined} alt={c.name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-background" />
            </div>
            <span className="text-sm font-medium truncate">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineCollaborators;