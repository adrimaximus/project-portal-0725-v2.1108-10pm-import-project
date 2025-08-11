import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { Collaborator } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

type OnlineCollaboratorsProps = {
  isCollapsed: boolean;
};

const OnlineCollaborators = ({ isCollapsed }: OnlineCollaboratorsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    let channel: RealtimeChannel;

    const setupPresence = async () => {
      // Ambil profil pengguna saat ini untuk dibagikan
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email')
        .eq('id', currentUser.id)
        .single();

      if (error || !profile) {
        console.error("Error fetching profile for presence tracking:", error);
        return;
      }

      // Siapkan nama dan inisial dengan fallback ke email
      const name = (`${profile.first_name || ''} ${profile.last_name || ''}`).trim() || profile.email || 'Anonymous';
      const initials = (`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}` || 'NN').toUpperCase();

      // Buat channel realtime untuk melacak pengguna online
      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      });

      // Event 'sync' dipanggil saat pertama kali terhubung, memberikan daftar lengkap pengguna online
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<Omit<Collaborator, 'online'>>();
        const collaborators = Object.keys(presenceState)
          .filter(presenceId => presenceId !== currentUser.id)
          .map(presenceId => {
            const pres = presenceState[presenceId][0];
            return { ...pres, online: true };
          });
        setOnlineCollaborators(collaborators);
      });

      // Event 'join' dipanggil saat pengguna baru masuk
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === currentUser.id) return;
        const newCollaborator = { ...(newPresences[0] as unknown as Omit<Collaborator, 'online'>), online: true };
        setOnlineCollaborators(prev => {
          if (prev.some(c => c.id === newCollaborator.id)) {
            return prev;
          }
          return [...prev, newCollaborator];
        });
      });

      // Event 'leave' dipanggil saat pengguna keluar
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === currentUser.id) return;
        const leftId = (leftPresences[0] as unknown as Collaborator).id;
        setOnlineCollaborators(prev => prev.filter(c => c.id !== leftId));
      });

      // Berlangganan ke channel dan lacak status pengguna saat ini
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: profile.id,
            name,
            initials,
            avatar: profile.avatar_url,
          });
        }
      });
    };

    setupPresence();

    // Membersihkan channel saat komponen dilepas
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser]);
  
  const visibleCollaborators = onlineCollaborators.slice(0, 3);
  const remainingCount = onlineCollaborators.length - visibleCollaborators.length;

  const handleCollaboratorClick = (collaborator: Collaborator) => {
    navigate('/chat', { 
      state: { 
        selectedCollaborator: collaborator
      } 
    });
  };

  if (isCollapsed) {
    return (
      <div className="p-2 flex justify-center">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative cursor-pointer">
                <Users className="h-5 w-5" />
                {onlineCollaborators.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                    {onlineCollaborators.length}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold">{onlineCollaborators.length} collaborators online</p>
              <ul className="mt-1 text-sm text-muted-foreground">
                {onlineCollaborators.map(c => <li key={c.id}>{c.name}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-4 py-4 transition-all duration-300">
      <h3 
        className="mb-3 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase cursor-pointer flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Online</span>
      </h3>
      <div className="px-3">
        {isExpanded ? (
          <div className="space-y-1">
            {onlineCollaborators.map(c => (
              <div 
                key={c.id} 
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleCollaboratorClick(c)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.avatar || `https://avatar.vercel.sh/${c.id}.png`} alt={c.name} />
                    <AvatarFallback className="bg-muted-foreground text-muted font-semibold">{c.initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <span className="text-sm text-foreground font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center cursor-pointer -space-x-3" onClick={() => setIsExpanded(true)}>
              {visibleCollaborators.map((collaborator, index) => (
                <Tooltip key={collaborator.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="relative transition-all duration-300 hover:z-40 hover:scale-110"
                      style={{ zIndex: index }}
                    >
                      <Avatar className="h-9 w-9 border-2 border-background bg-background">
                        <AvatarImage src={collaborator.avatar || `https://avatar.vercel.sh/${collaborator.id}.png`} alt={collaborator.name} />
                        <AvatarFallback className="bg-muted-foreground text-muted font-semibold">{collaborator.initials}</AvatarFallback>
                      </Avatar>
                      {index === visibleCollaborators.length - 1 && remainingCount === 0 && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-primary text-primary-foreground">
                    <p>{collaborator.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground border-2 border-background text-xs font-semibold hover:z-40 hover:scale-110 transition-transform"
                      style={{ zIndex: visibleCollaborators.length }}
                    >
                      +{remainingCount}
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-primary text-primary-foreground">
                    <p>{remainingCount} more online</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default OnlineCollaborators;