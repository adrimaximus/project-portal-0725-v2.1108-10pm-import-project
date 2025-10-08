import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignedUser } from "@/types";
import { generatePastelColor } from "@/lib/utils";

interface ModernTeamSelectorProps {
  users: AssignedUser[];
  selectedUsers: AssignedUser[];
  onSelectionChange: (user: AssignedUser) => void;
}

const ModernTeamSelector = ({ users, selectedUsers, onSelectionChange }: ModernTeamSelectorProps) => {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (e: React.MouseEvent, user: AssignedUser) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(user);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px]"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedUsers.length > 0 ? (
              selectedUsers.map((user) => (
                <Badge
                  variant="secondary"
                  key={user.id}
                  className="mr-1"
                >
                  {user.name}
                  <button
                    onClick={(e) => handleUnselect(e, user)}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">Select team members...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search for a user..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    onSelectionChange(user);
                  }}
                  value={user.name}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.some((su) => su.id === user.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                     <Avatar className="h-6 w-6">
                       <AvatarImage src={user.avatar_url} alt={user.name} />
                       <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                     </Avatar>
                     <span>{user.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModernTeamSelector;