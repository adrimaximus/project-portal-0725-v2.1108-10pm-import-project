"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { AssignedUser } from "@/data/projects";

interface UserMultiSelectProps {
    allUsers: AssignedUser[];
    selectedUsers: AssignedUser[];
    onSelectedUsersChange: (users: AssignedUser[]) => void;
}

export default function UserMultiSelect({ allUsers, selectedUsers, onSelectedUsersChange }: UserMultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((user: AssignedUser) => {
    onSelectedUsersChange(selectedUsers.filter((s) => s.id !== user.id));
  }, [onSelectedUsersChange, selectedUsers]);

  const handleSelect = (user: AssignedUser) => {
    setInputValue("");
    if (!selectedUsers.some(u => u.id === user.id)) {
        onSelectedUsersChange([...selectedUsers, user]);
    }
  };

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          const newSelected = [...selectedUsers];
          newSelected.pop();
          onSelectedUsersChange(newSelected);
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  }, [onSelectedUsersChange, selectedUsers]);

  const selectableUsers = allUsers.filter(user => !selectedUsers.some(selected => selected.id === user.id));

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div
        className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        <div className="flex gap-1 flex-wrap">
          {selectedUsers.map((user) => {
            return (
              <Badge key={user.id} variant="secondary">
                {user.name}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(user);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(user)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder="Select users..."
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectableUsers.length > 0 ?
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto">
              {selectableUsers.map((user) => {
                return (
                  <CommandItem
                    key={user.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(user)}
                    className={"cursor-pointer"}
                  >
                    {user.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
          : null}
      </div>
    </Command>
  )
}