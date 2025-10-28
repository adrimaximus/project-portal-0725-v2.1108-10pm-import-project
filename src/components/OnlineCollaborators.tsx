import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { Collaborator } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

type OnlineCollaboratorsProps = {
  isCollapsed: boolean;
};

const OnlineCollaborators = ({ isCollapsed }: OnlineCollaboratorsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { onlineCollaborators } = useAuth();

  const uniqueCollaborators = useMemo(() => {
    const map = new Map<string, Collaborator & { isIdle: boolean }>();
    const fiveMinutesAgo = new Date().getTime() - 5 * 60 * 1000;

    onlineCollaborators.forEach(c => {
      if (!map.has(c.id)) {
        const lastActive = c.last_active_at ? new Date(c.last_active_at).getTime() : 0;
        const isIdle = lastActive < fiveMinutesAgo;
        map.set(c.id, { ...c, isIdle });
      }
    });
    return Array.from(map.values());
  }, [onlineCollaborators]);

  const activeCollaborators = useMemo(() => uniqueCollaborators.filter(c => !c.isIdle), [uniqueCollaborators]);
  const idleCollaborators = useMemo(() => uniqueCollaborators.filter(c => c.isIdle), [uniqueCollaborators]);

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
                  {uniqueCollaborators.length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold">{uniqueCollaborators.length} collaborators online</p>
              <ul className="mt-1 text-sm text-muted-foreground">
                {uniqueCollaborators.map(c => <li key={c.id}>{c.name}</li>)}
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
            {uniqueCollaborators.map(c => (
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
              {activeCollaborators.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {activeCollaborators.map((collaborator, index) => (
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
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-primary text-primary-foreground">
                          <p>{collaborator.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative pl-2">
                        <span className="block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-primary text-primary-foreground">
                      <p>{activeCollaborators.length} Active</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {idleCollaborators.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {idleCollaborators.map((collaborator, index) => (
                      <Tooltip key={collaborator.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative transition-all duration-300 hover:z-40 hover:scale-110"
                            style={{ zIndex: index + activeCollaborators.length }}
                          >
                            <Avatar className="h-9 w-9 border-2 border-background bg-background">
                              <AvatarImage src={getAvatarUrl(collaborator.avatar_url, collaborator.id)} alt={collaborator.name} />
                              <AvatarFallback style={generatePastelColor(collaborator.id)}>{collaborator.initials}</AvatarFallback>
                            </Avatar>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-primary text-primary-foreground">
                          <p>{collaborator.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative pl-2">
                        <span className="block h-2.5 w-2.5 rounded-full bg-orange-400 ring-2 ring-background" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-primary text-primary-foreground">
                      <p>{idleCollaborators.length} Idle</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default OnlineCollaborators;