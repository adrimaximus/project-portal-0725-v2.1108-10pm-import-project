"use client";

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
import { allUsers, User } from "@/data/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAssignmentProps {
  selectedUserIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function UserAssignment({ selectedUserIds, onSelectionChange }: UserAssignmentProps) {
  const [open, setOpen] = React.useState(false);
  const users = allUsers;

  const handleSelect = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];
    onSelectionChange(newSelection);
  };

  const selectedUsers = selectedUserIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Assign Users
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[2.5rem]"
          >
            <div className="flex gap-1 flex-wrap">
              {selectedUsers.length > 0 ? (
                selectedUsers.map(user => (
                  <Badge
                    variant="secondary"
                    key={user.id}
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(user.id);
                    }}
                  >
                    {user.name}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground font-normal">Select users...</span>
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
                    onSelect={() => handleSelect(user.id)}
                    value={user.name}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center w-full">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className={`ml-auto h-2 w-2 rounded-full ${user.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
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
}