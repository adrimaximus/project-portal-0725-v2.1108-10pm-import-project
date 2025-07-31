import React from "react";
import { Project, AssignedUser } from "@/data/projects";
import { allUsers } from "@/data/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FileText, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { services as allServices, type Service } from "@/data/services";
import { Separator } from "../ui/separator";
import FileUpload from "./FileUpload";
import { differenceInDays, isFuture, isPast, parseISO } from "date-fns";

interface AssignedTeamProps {
  users: AssignedUser[];
  isEditing: boolean;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const AssignedTeam = ({ users, isEditing, onTeamChange }: AssignedTeamProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (currentUser: AssignedUser) => {
    const isSelected = users.some(u => u.id === currentUser.id);
    let newSelectedUsers: AssignedUser[];
    if (isSelected) {
      newSelectedUsers = users.filter(u => u.id !== currentUser.id);
    } else {
      const newUserToAdd: AssignedUser = { ...currentUser, status: 'Offline' };
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
    .map((serviceName) => allServices.find((s) => s.title === serviceName))
    .filter((s): s is Service => s !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {serviceDetails.map((service) => (
            <Badge
              key={service.title}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <service.icon className={cn("h-4 w-4", service.iconColor)} />
              <span>{service.title}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
}

const ProjectOverview = ({ project, isEditing, onDescriptionChange, onTeamChange, onFilesChange }: ProjectOverviewProps) => {
  const getStatusBadge = () => {
    const today = new Date();
    const startDate = parseISO(project.startDate);
    const deadline = parseISO(project.deadline);

    if (isFuture(startDate)) {
      const daysUntilStart = differenceInDays(startDate, today);
      return (
        <Badge variant="outline" className="ml-3 font-normal">
          Starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}
        </Badge>
      );
    }

    if (isPast(deadline)) {
      return (
        <Badge variant="secondary" className="ml-3 font-normal bg-green-100 text-green-800 border-green-200">
          Done
        </Badge>
      );
    }

    if (isPast(startDate) && isFuture(deadline)) {
      return (
        <Badge variant="secondary" className="ml-3 font-normal bg-blue-100 text-blue-800 border-blue-200">
          On Going
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center">
                Project Description
                {getStatusBadge()}
              </CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-right">
                    <div className="not-sr-only">
                      <p className="text-sm font-medium">{project.createdBy.name}</p>
                      <p className="text-xs text-muted-foreground">Project Creator</p>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
                      <AvatarFallback>{project.createdBy.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.createdBy.name} ({project.createdBy.email})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            
            {(isEditing || (project.briefFiles && project.briefFiles.length > 0)) && (
              <>
                <Separator className="my-6" />
                <div>
                  {isEditing ? (
                    <>
                      <h4 className="text-sm font-medium mb-3 text-foreground">Attach Brief Files</h4>
                      <FileUpload 
                        files={project.briefFiles || []}
                        onFilesChange={onFilesChange}
                      />
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium mb-3 text-foreground">Brief Files</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {project.briefFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden aspect-square"
                            title={file.name}
                          >
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-2">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <a
                                href={URL.createObjectURL(file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                title="Preview file"
                              >
                                <Eye className="h-5 w-5" />
                              </a>
                              <a
                                href={URL.createObjectURL(file)}
                                download={file.name}
                                className="text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                title="Download file"
                              >
                                <Download className="h-5 w-5" />
                              </a>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
                              <p className="text-xs text-white truncate">
                                {file.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <AssignedTeam 
          users={project.assignedTo} 
          isEditing={isEditing}
          onTeamChange={onTeamChange}
        />
        <ProjectServices services={project.services} />
      </div>
    </div>
  );
};

export default ProjectOverview;