import { Project, AssignedUser } from "@/data/projects";
import { User, allUsers } from "@/data/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, X } from "lucide-react";

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectOverview = ({ project, isEditing, onDescriptionChange, onTeamChange }: ProjectOverviewProps) => {
  const unassignedUsers = allUsers.filter(user => !project.assignedTo.some(assigned => assigned.id === user.id));

  const handleAddTeamMember = (user: User) => {
    const newMember: AssignedUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      status: 'Offline', // Fixed casing
    };
    onTeamChange([...project.assignedTo, newMember]);
  };

  const handleRemoveTeamMember = (userId: string) => {
    onTeamChange(project.assignedTo.filter(member => member.id !== userId));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Project Description</CardTitle></CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={project.description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={5}
              />
            ) : (
              <p className="text-muted-foreground">{project.description || "No description provided."}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Services</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {project.services?.map(service => <Badge key={service} variant="secondary">{service}</Badge>)}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {project.assignedTo.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.slice(0,2)}</AvatarFallback></Avatar>
                  <p className="font-medium">{user.name}</p>
                </div>
                {isEditing && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveTeamMember(user.id)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <PlusCircle className="h-4 w-4" /> Add team member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {unassignedUsers.map(user => (
                          <CommandItem key={user.id} onSelect={() => handleAddTeamMember(user)}>
                            {user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverview;