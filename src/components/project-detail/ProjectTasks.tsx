import { useState } from "react";
import { Task, AssignedUser } from "@/data/projects";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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


interface ProjectTasksProps {
  tasks: Task[];
  assignableUsers: AssignedUser[];
  onTasksUpdate: (tasks: Task[]) => void;
}

const ProjectTasks = ({ tasks, assignableUsers, onTasksUpdate }: ProjectTasksProps) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onTasksUpdate(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onTasksUpdate(updatedTasks);
  };

  const handleTaskAssignmentChange = (taskId: string, userId: string) => {
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
    if (newTaskText.trim() === "") return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: newTaskText.trim(),
      completed: false,
      assignedTo: newTaskAssignees,
    };
    onTasksUpdate([...tasks, newTask]);
    setNewTaskText("");
    setNewTaskAssignees([]);
  };

  const getAssigneeDetails = (userId: string) => {
    return assignableUsers.find(u => u.id === userId);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
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
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? tasks.map(task => (
              <TableRow key={task.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                </TableCell>
                <TableCell className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                  {task.name}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <TooltipContent><p>{user.name}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No tasks yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectTasks;