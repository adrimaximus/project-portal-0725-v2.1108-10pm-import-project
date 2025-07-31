import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project, Task, AssignedUser } from "@/data/projects";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// A small component for the assignment popover content
const TaskAssigneeSelector = ({
  assignableUsers,
  selectedUserIds,
  onSelectionChange,
}: {
  assignableUsers: AssignedUser[];
  selectedUserIds: string[];
  onSelectionChange: (userId: string) => void;
}) => {
  return (
    <Command>
      <CommandInput placeholder="Assign to..." />
      <CommandList>
        <CommandEmpty>No team members found.</CommandEmpty>
        <CommandGroup>
          {assignableUsers.map((user) => (
            <CommandItem
              key={user.id}
              value={user.name}
              onSelect={() => onSelectionChange(user.id)}
              className="cursor-pointer"
            >
              <Checkbox
                className="mr-2"
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={() => onSelectionChange(user.id)}
              />
              <Avatar className="mr-2 h-6 w-6">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials || user.name?.slice(0, 2) || '??'}</AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

interface ProjectProgressCardProps {
  project: Project;
  onTasksUpdate?: (tasks: Task[]) => void;
}

const ProjectProgressCard = ({ project, onTasksUpdate }: ProjectProgressCardProps) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const tasks = project.tasks || [];
  const assignableUsers = project.assignedTo || [];

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Automatically create tasks from comments marked as tickets
  useEffect(() => {
    if (!onTasksUpdate || !project.comments) return;

    const ticketComments = project.comments.filter((c: any) => c.isTicket);
    const existingTaskTexts = new Set(tasks.map(t => t.text));

    const newTasksToCreate: Task[] = ticketComments
      .filter((ticket: any) => !existingTaskTexts.has(ticket.text))
      .map((ticket: any) => ({
        id: `task-from-comment-${ticket.id}`,
        text: ticket.text,
        completed: false,
        assignedTo: ticket.mentions || [],
      }));

    if (newTasksToCreate.length > 0) {
      onTasksUpdate([...tasks, ...newTasksToCreate]);
    }
  }, [project.comments, tasks, onTasksUpdate]);

  const handleToggleTask = (taskId: string) => {
    if (!onTasksUpdate) return;
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onTasksUpdate(updatedTasks);
  };

  const handleTaskAssignmentChange = (taskId: string, userId: string) => {
    if (!onTasksUpdate) return;
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const currentAssignees = task.assignedTo || [];
        const isAssigned = currentAssignees.includes(userId);
        const newAssignees = isAssigned
          ? currentAssignees.filter(id => id !== userId)
          : [...currentAssignees, userId];
        return { ...task, assignedTo: newAssignees };
      }
      return task;
    });
    onTasksUpdate(updatedTasks);
  };

  const handleNewTaskAssigneeChange = (userId: string) => {
    setNewTaskAssignees(prev => {
      const isAssigned = prev.includes(userId);
      return isAssigned ? prev.filter(id => id !== userId) : [...prev, userId];
    });
  };

  const handleAddTask = () => {
    if (!onTasksUpdate || newTaskText.trim() === "") return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      assignedTo: newTaskAssignees,
    };
    const updatedTasks = [...tasks, newTask];
    onTasksUpdate(updatedTasks);
    setNewTaskText("");
    setNewTaskAssignees([]);
  };

  const getAssigneeDetails = (userId: string) => {
    return assignableUsers.find(u => u.id === userId) || project.createdBy;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          {onTasksUpdate
            ? `${completedTasks} of ${totalTasks} tasks completed.`
            : `This project is ${project.progress}% complete.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-bold">{onTasksUpdate ? progressPercentage : project.progress}%</span>
        </div>
        <Progress value={onTasksUpdate ? progressPercentage : project.progress} className={onTasksUpdate ? "mb-6" : ""} />
        
        {onTasksUpdate && (
          <>
            <Separator className="my-4" />

            <h4 className="text-sm font-medium mb-3">Tasks</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between group -ml-1.5">
                    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                      <Checkbox
                        id={task.id}
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="ml-1.5"
                      />
                      <label
                        htmlFor={task.id}
                        className={`text-sm font-medium leading-none truncate cursor-pointer ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                        title={task.text}
                      >
                        {task.text}
                      </label>
                    </div>
                    <div className="flex items-center ml-2">
                      <div className="flex -space-x-2 mr-1">
                        {task.assignedTo?.map(userId => {
                          const user = getAssigneeDetails(userId);
                          if (!user) return null;
                          return (
                            <TooltipProvider key={user.id} delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.initials || user.name?.slice(0, 1) || '??'}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{user.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-64">
                          <TaskAssigneeSelector
                            assignableUsers={assignableUsers}
                            selectedUserIds={task.assignedTo || []}
                            onSelectionChange={(userId) => handleTaskAssignmentChange(task.id, userId)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <UserPlus className="h-4 w-4" />
                    {newTaskAssignees.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {newTaskAssignees.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-64">
                  <TaskAssigneeSelector
                    assignableUsers={assignableUsers}
                    selectedUserIds={newTaskAssignees}
                    onSelectionChange={handleNewTaskAssigneeChange}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleAddTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;