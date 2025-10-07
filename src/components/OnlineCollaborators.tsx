import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
}

const useOnlineCollaborators = (projectId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onlineCollaborators', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: members, error } = await supabase
        .from('project_members')
        .select('user_id, profiles(id, first_name, last_name, email, avatar_url)')
        .eq('project_id', projectId);

      if (error) throw error;

      const collaborators: Collaborator[] = members.map((m: any) => {
        const name = [m.profiles.first_name, m.profiles.last_name].filter(Boolean).join(' ');
        return {
          id: m.profiles.id,
          name: name || m.profiles.email,
          email: m.profiles.email,
          avatar_url: m.profiles.avatar_url,
          initials: (name || m.profiles.email).substring(0, 2).toUpperCase(),
        };
      });

      // Mock online status for now
      const onlineCollaborators = collaborators.filter(c => c.id !== user?.id);
      return onlineCollaborators;
    },
    enabled: !!projectId && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

const OnlineCollaborators = ({ projectId }: { projectId?: string }) => {
  const { data: collaborators = [], isLoading } = useOnlineCollaborators(projectId);

  if (isLoading) {
    return <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />;
  }

  if (!collaborators.length) {
    return null;
  }

  const visibleCollaborators = collaborators.slice(0, 3);
  const hiddenCount = collaborators.length - visibleCollaborators.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visibleCollaborators.map((c) => (
          <TooltipProvider key={c.id}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(c)} alt={c.name} />
                  <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{c.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background -ml-2">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <ul>
                {collaborators.slice(3).map(collaborator => (
                  <li key={collaborator.id} className="flex items-center gap-2 py-1">
                    <Avatar className="h-9 w-9 border-2 border-background bg-background">
                      <AvatarImage src={getAvatarUrl(collaborator)} alt={collaborator.name} />
                      <AvatarFallback style={generatePastelColor(collaborator.id)}>{collaborator.initials}</AvatarFallback>
                    </Avatar>
                    <span>{collaborator.name}</span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default OnlineCollaborators;