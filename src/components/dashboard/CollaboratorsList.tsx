import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronsUpDown } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
}

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  selectedCollaborators: Collaborator[];
  onSelect: (collaborator: Collaborator) => void;
  onDeselect: (collaboratorId: string) => void;
}

const CollaboratorsList = ({
  collaborators,
  selectedCollaborators,
  onSelect,
  onDeselect,
}: CollaboratorsListProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {selectedCollaborators.map((c) => (
          <TooltipProvider key={c.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={() => onDeselect(c.id)} className="cursor-pointer">
                  <Avatar className="h-8 w-8 border-2 border-card">
                    <AvatarImage src={getAvatarUrl(c)} alt={c.name} />
                    <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{c.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[200px] justify-between"
          >
            Add collaborator
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search collaborator..." />
            <CommandList>
              <CommandEmpty>No collaborator found.</CommandEmpty>
              <CommandGroup>
                {collaborators.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => onSelect(c)}
                    value={c.name}
                  >
                    <div className="flex items-center">
                       <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={getAvatarUrl(c)} alt={c.name} />
                          <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                        </Avatar>
                      {c.name}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CollaboratorsList;