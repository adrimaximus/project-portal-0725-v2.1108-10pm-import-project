import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { allUsers as users } from "@/data/users";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserSelectProps {
  selectedUsers: string[];
  onSelectedUsersChange: (userIds: string[]) => void;
}

export function UserSelect({ selectedUsers, onSelectedUsersChange }: UserSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId];
    onSelectedUsersChange(newSelection);
  };

  const selectedUserDetails = users.filter(user => selectedUsers.includes(user.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
        >
          <div className="flex flex-wrap gap-1">
            {selectedUserDetails.length > 0 ? (
              selectedUserDetails.map(user => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </Badge>
              ))
            ) : (
              "Select users..."
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}