import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@/types"
import { generatePastelColor } from "@/lib/utils"

interface ModernTeamSelectorProps {
  users: User[];
  selectedUsers: User[];
  onSelectionChange: (user: User) => void;
}

const ModernTeamSelector = ({ users, selectedUsers, onSelectionChange }: ModernTeamSelectorProps) => {
  const [open, setOpen] = React.useState(false)

  // This function ensures we always pass a consistent user object to the parent
  const handleToggleSelection = (userToToggle: User) => {
    // Find the original user object from the main list to ensure we don't pass stale role data
    const pristineUser = users.find(u => u.id === userToToggle.id);
    if (pristineUser) {
      onSelectionChange(pristineUser);
    }
  };

  const handleUnselectBadge = (e: React.MouseEvent, user: User) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleSelection(user);
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
                    onClick={(e) => handleUnselectBadge(e, user)}
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
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    handleToggleSelection(user);
                  }}
                  value={`${user.name} ${user.email}`}
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
                     <div className="flex flex-col">
                       <span className="text-sm font-medium">{user.name}</span>
                       <span className="text-xs text-muted-foreground">{user.email}</span>
                     </div>
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