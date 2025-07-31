import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { User } from "@/data/projects";
import { dummyUsers } from "@/data/users";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamSelectorProps {
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
}

export function TeamSelector({ selectedUsers, onSelectionChange }: TeamSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      onSelectionChange(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onSelectionChange([...selectedUsers, user]);
    }
  };

  return (
    <div className="relative">
      <Command>
        <CommandInput placeholder="Search users..." onFocus={() => setOpen(true)} />
        <CommandList>
          {open && (
            <>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {dummyUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUsers.some((u) => u.id === user.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <span>{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}