import React from 'react';
import { Project, AssignedUser } from '@/data/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ProjectTeamProps {
  project: Project;
  isEditing: boolean;
  editedAssignedTo: AssignedUser[];
  onAssignedToChange: (users: AssignedUser[]) => void;
  availableUsers: AssignedUser[];
}

const ProjectTeam: React.FC<ProjectTeamProps> = ({ project, isEditing, editedAssignedTo, onAssignedToChange, availableUsers }) => {
  const [open, setOpen] = React.useState(false)
  
  const handleSelect = (user: AssignedUser) => {
    const isSelected = editedAssignedTo.some(u => u.name === user.name);
    if (isSelected) {
      onAssignedToChange(editedAssignedTo.filter(u => u.name !== user.name));
    } else {
      onAssignedToChange([...editedAssignedTo, user]);
    }
  };

  const assignedUsers = isEditing ? editedAssignedTo : project.assignedTo;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assigned Team</CardTitle>
        {isEditing && (
           <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                Assign users...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map((user) => (
                    <CommandItem
                      key={user.name}
                      value={user.name}
                      onSelect={() => {
                        handleSelect(user);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          editedAssignedTo.some(u => u.name === user.name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent>
        {assignedUsers.length > 0 ? (
          <div className="space-y-4">
            {assignedUsers.map(user => (
              <div key={user.name} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No users assigned to this project.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;