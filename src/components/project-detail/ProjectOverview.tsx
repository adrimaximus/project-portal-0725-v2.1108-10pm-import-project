import React from "react";
import { Project, AssignedUser } from "@/data/projects";
import { allUsers, User } from "@/data/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { allServices, type Service } from "@/data/services";

interface AssignedTeamProps {
  users: AssignedUser[];
  isEditing: boolean;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const AssignedTeam = ({ users, isEditing, onTeamChange }: AssignedTeamProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (currentUser: User) => {
    const isSelected = users.some(u => u.id === currentUser.id);
    let newSelectedUsers: AssignedUser[];
    if (isSelected) {
      newSelectedUsers = users.filter(u => u.id !== currentUser.id);
    } else {
      const newUserToAdd: AssignedUser = { ...currentUser, status: 'offline' };
      newSelectedUsers = [...users, newUserToAdd];
    }
    onTeamChange(newSelectedUsers);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2 overflow-hidden">
              {users.map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="inline-block h-10 w-10 rounded-full ring-2 ring-background">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{users.length} members</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Team</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="truncate">
                {users.length > 0 ? `${users.length} member(s) selected` : "Select team members..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search members..." />
              <CommandList>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {allUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => handleSelect(user)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          users.some(u => u.id === user.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0,2)}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="mt-4 flex flex-wrap gap-2">
          {users.map(user => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1 p-1 pr-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0,2)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.name}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectServices = ({ services }: { services: string[] }) => {
  const serviceDetails = services
    .map((serviceName) => allServices.find((s) => s.name === serviceName))
    .filter((s): s is Service => s !== undefined);

  if (serviceDetails.length === 0) {
    return null;
  }

  return (
    <div className="pt-6 mt-6 border-t">
      <h4 className="text-base font-semibold mb-4">Services</h4>
      <div className="flex flex-wrap gap-2">
        {serviceDetails.map((service) => (
          <Badge
            key={service.name}
            variant="outline"
            className="flex items-center gap-2 p-2"
          >
            <service.icon className={cn("h-4 w-4", service.color)} />
            <span className="font-medium">{service.name}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectOverview = ({ project, isEditing, onDescriptionChange, onTeamChange }: ProjectOverviewProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <RichTextEditor
                value={project.description}
                onChange={onDescriptionChange}
                placeholder="Enter project description..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
            <ProjectServices services={project.services} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <AssignedTeam 
          users={project.assignedTo} 
          isEditing={isEditing}
          onTeamChange={onTeamChange}
        />
      </div>
    </div>
  );
};

export default ProjectOverview;