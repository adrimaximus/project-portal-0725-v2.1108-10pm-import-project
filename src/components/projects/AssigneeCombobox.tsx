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
import { generatePastelColor, getAvatarUrl } from "@/lib/utils"

interface AssigneeComboboxProps {
  users: User[];
  selectedUsers: User[];
  onChange: (users: User[]) => void;
  disabled?: boolean;
}

export function AssigneeCombobox({ users, selectedUsers, onChange, disabled }: AssigneeComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggleSelection = (userToToggle: User) => {
    const isSelected = selectedUsers.some(u => u.id === userToToggle.id);
    const newSelection = isSelected
      ? selectedUsers.filter(u => u.id !== userToToggle.id)
      : [...selectedUsers, userToToggle];
    onChange(newSelection);
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
          disabled={disabled}
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
              <span className="text-muted-foreground font-normal">Select assignees...</span>
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
                       <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                       <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                     </Avatar>
                     <div className="flex flex-col">
                       <span className="text-sm font-medium">{user.name}</span>
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
}