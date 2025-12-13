import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { Collaborator } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

type OnlineCollaboratorsProps = {
  isCollapsed: boolean;
};

const MAX_VISIBLE_AVATARS = 5;
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 menit dianggap idle

const OnlineCollaborators = ({ isCollapsed }: OnlineCollaboratorsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();
  const { onlineCollaborators } = useAuth();

  // Perbarui waktu setiap 1 menit untuk mengecek status idle secara real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Proses kolaborator untuk menentukan status idle berdasarkan waktu terakhir aktif
  const processedCollaborators = useMemo(() => {
    return onlineCollaborators.map(c => {
      let isIdle = c.isIdle;
      
      // Override status idle jika last_active_at lebih dari 5 menit yang lalu
      // We know `last_active_at` might exist on `Collaborator` which extends `User` in our updated types
      if (c.last_active_at) {
        const lastActiveTime = new Date(c.last_active_at).getTime();
        if (currentTime - lastActiveTime > IDLE_THRESHOLD_MS) {
          isIdle = true;
        }
      }
      
      return { ...c, isIdle };
    });
  }, [onlineCollaborators, currentTime]);

  // Sort collaborators: active first, then idle
  const sortedCollaborators = useMemo(() => {
    const active = processedCollaborators.filter(c => !c.isIdle);
    const idle = processedCollaborators.filter(c => c.isIdle);
    return [...active, ...idle];
  }, [processedCollaborators]);

  // Determine which collaborators are visible and which are hidden
  const visibleCollaborators = useMemo(() => {
    return sortedCollaborators.slice(0, MAX_VISIBLE_AVATARS);
  }, [sortedCollaborators]);

  const hiddenCollaborators = useMemo(() => {
    return sortedCollaborators.slice(MAX_VISIBLE_AVATARS);
  }, [sortedCollaborators]);

  const hiddenCount = hiddenCollaborators.length;

  // Check if there's at least one active user in the hidden group to determine dot color
  const hasActiveInHidden = useMemo(() => {
    return hiddenCollaborators.some(c => !c.isIdle);
  }, [hiddenCollaborators]);

  // Check if there's any active user at all (for the rightmost avatar dot)
  const hasAnyActive = useMemo(() => processedCollaborators.some(c => !c.isIdle), [processedCollaborators]);

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
                <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                  {processedCollaborators.length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold">{processedCollaborators.length} collaborators online</p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1.5">
                {processedCollaborators.map(c => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.isIdle ? 'bg-orange-400' : 'bg-green-500'}`} />
                    <span className="capitalize">
                      {c.name} - {c.last_active_at ? `${formatDistanceToNow(new Date(c.last_active_at))} ${c.isIdle ? 'idle' : 'active'}` : (c.isIdle ? 'Idle' : 'Active')}
                    </span>
                  </li>
                ))}
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
      <div>
        {isExpanded ? (
          <div className="space-y-1 px-3">
            {processedCollaborators.map(c => (
              <div 
                key={c.id} 
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleCollaboratorClick(c)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                    <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${c.isIdle ? 'bg-orange-400' : 'bg-green-500'}`} />
                </div>
                <span className="text-sm text-foreground font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center space-x-4 cursor-pointer px-3" onClick={() => setIsExpanded(true)}>
              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {visibleCollaborators.map((collaborator, index) => (
                    <Tooltip key={collaborator.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative transition-all duration-300 hover:z-40 hover:scale-110"
                          style={{ zIndex: index }}
                        >
                          <Avatar className="h-9 w-9 border-2 border-background bg-background">
                            <AvatarImage src={getAvatarUrl(collaborator.avatar_url, collaborator.id)} alt={collaborator.name} />
                            <AvatarFallback style={generatePastelColor(collaborator.id)}>{collaborator.initials}</AvatarFallback>
                          </Avatar>
                          {hiddenCount === 0 && index === visibleCollaborators.length - 1 && (
                             <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${hasAnyActive ? 'bg-green-500' : 'bg-orange-400'}`} />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-primary text-primary-foreground">
                        <p className="font-semibold">{collaborator.name}</p>
                        {collaborator.last_active_at && (
                          <p className="text-xs capitalize">
                            {formatDistanceToNow(new Date(collaborator.last_active_at))} {collaborator.isIdle ? 'idle' : 'active'}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {hiddenCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="relative transition-all duration-300 hover:z-40 hover:scale-110"
                          style={{ zIndex: visibleCollaborators.length }}
                        >
                          <Avatar className="h-9 w-9 border-2 border-background bg-background">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              +{hiddenCount}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${hasActiveInHidden ? 'bg-green-500' : 'bg-orange-400'}`} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-primary text-primary-foreground">
                        <p>{hiddenCount} more {hiddenCount > 1 ? 'people' : 'person'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default OnlineCollaborators;