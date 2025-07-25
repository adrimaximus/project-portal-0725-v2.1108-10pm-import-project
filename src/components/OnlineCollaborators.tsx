import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

// Data tiruan untuk kolaborator
const collaborators = [
  { name: "Jane Doe", src: "https://i.pravatar.cc/40?u=a042581f4e29026704d", fallback: "JD" },
  { name: "John Smith", src: "https://i.pravatar.cc/40?u=a042581f4e29026705d", fallback: "JS" },
  { name: "Peter Jones", src: "https://i.pravatar.cc/40?u=a042581f4e29026706d", fallback: "PJ" },
  { name: "Sarah Miller", src: "https://i.pravatar.cc/40?u=a042581f4e29026707d", fallback: "SM" },
];

type OnlineCollaboratorsProps = {
  isCollapsed: boolean;
};

const OnlineCollaborators = ({ isCollapsed }: OnlineCollaboratorsProps) => {
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
                {collaborators.map(c => <li key={c.name}>{c.name}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-4 py-4">
      <h3 className="mb-3 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        Online
      </h3>
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center px-3">
          {visibleCollaborators.map((collaborator, index) => (
            <Tooltip key={collaborator.name}>
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
    </div>
  );
};

export default OnlineCollaborators;