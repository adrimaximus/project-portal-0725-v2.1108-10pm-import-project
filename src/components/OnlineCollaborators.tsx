import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Collaborator } from "../types";

// Data tiruan untuk kolaborator
const collaborators: Collaborator[] = [
  { id: "1", name: "Jane Doe", src: "https://i.pravatar.cc/40?u=a042581f4e29026704d", fallback: "JD" },
  { id: "2", name: "John Smith", src: "https://i.pravatar.cc/40?u=a042581f4e29026705d", fallback: "JS" },
  { id: "3", name: "Peter Jones", src: "https://i.pravatar.cc/40?u=a042581f4e29026706d", fallback: "PJ" },
  { id: "4", name: "Sarah Miller", src: "https://i.pravatar.cc/40?u=a042581f4e29026707d", fallback: "SM" },
];

type OnlineCollaboratorsProps = {
  isCollapsed: boolean;
  onCollaboratorSelect: (collaborator: Collaborator) => void;
};

const OnlineCollaborators = ({ isCollapsed, onCollaboratorSelect }: OnlineCollaboratorsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleCollaborators = collaborators.slice(0, 3);
  const remainingCount = collaborators.length - visibleCollaborators.length;

  if (isCollapsed) {
    return (
      <div className="p-2 flex justify-center">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative cursor-pointer">
                <Users className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                  {collaborators.length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold">{collaborators.length} collaborators online</p>
              <ul className="mt-1 text-sm text-muted-foreground">
                {collaborators.map(c => <li key={c.id}>{c.name}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-4 py-4">
      <h3 
        className="mb-3 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Online
      </h3>
      <div className="px-3">
        {isExpanded ? (
          <div className="space-y-1">
            {collaborators.map(c => (
              <div 
                key={c.id} 
                className="flex items-center gap-3 p-1 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => onCollaboratorSelect(c)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={c.src} alt={c.name} />
                  <AvatarFallback>{c.fallback}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center cursor-pointer" onClick={() => setIsExpanded(true)}>
              {visibleCollaborators.map((collaborator, index) => (
                <Tooltip key={collaborator.id}>
                  <TooltipTrigger asChild>
                    <Avatar className={cn("h-8 w-8 border-2 border-background", index > 0 && "-ml-3")}>
                      <AvatarImage src={collaborator.src} alt={collaborator.name} />
                      <AvatarFallback>{collaborator.fallback}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">{collaborator.name}</TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground -ml-3 border-2 border-background text-xs font-semibold">
                      +{remainingCount}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{remainingCount} more collaborators</TooltipContent>
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