import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { Collaborator } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

const OnlineCollaborators = () => {
  const { onlineCollaborators } = useAuth();

  if (onlineCollaborators.length === 0) {
    return null;
  }

  const visibleCollaborators = onlineCollaborators.slice(0, 3);
  const hiddenCount = onlineCollaborators.length - visibleCollaborators.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative h-auto p-0">
          <div className="flex items-center -space-x-2">
            {visibleCollaborators.map((c: Collaborator) => (
              <Avatar key={c.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(c.id) }}>{c.initials}</AvatarFallback>
              </Avatar>
            ))}
            {hiddenCount > 0 && (
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback>+{hiddenCount}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Online Collaborators ({onlineCollaborators.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {onlineCollaborators.map((collaborator: Collaborator) => (
            <div key={collaborator.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={getAvatarUrl(collaborator.avatar_url, collaborator.id)} alt={collaborator.name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(collaborator.id) }}>{collaborator.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{collaborator.name}</p>
                <p className="text-sm text-muted-foreground">{collaborator.email}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnlineCollaborators;