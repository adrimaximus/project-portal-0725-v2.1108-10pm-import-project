import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Project, Task, User } from "@/data/projects";
import { CheckCircle2, PlusCircle, UserPlus } from "lucide-react";

interface ProjectProgressCardProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export const ProjectProgressCard = ({ project, onUpdate }: ProjectProgressCardProps) => {
  const [taskText, setTaskText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    const assignedToUsers = selectedUsers
      .map(userId => project.assignedTo.find(u => u.id === userId))
      .filter((u): u is User => !!u);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: taskText,
      completed: false,
      assignedTo: assignedToUsers,
    };
    onUpdate({ ...project, tasks: [...(project.tasks || []), newTask] });
    setTaskText('');
    setSelectedUsers([]);
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = (project.tasks || []).map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdate({ ...project, tasks: updatedTasks });
  };

  const handleAssign = (task: Task, userId: string) => {
    const userToAssign = project.assignedTo.find(u => u.id === userId);
    if (!userToAssign) return;

    const updatedTasks = (project.tasks || []).map(t =>
      t.id === task.id
        ? { ...t, assignedTo: [...(t.assignedTo || []), userToAssign] }
        : t
    );
    onUpdate({ ...project, tasks: updatedTasks });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <Progress value={progress} className="mb-4" />
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {project.tasks?.map(task => {
            const assignedUserIds = task.assignedTo?.map(u => u.id) || [];
            const unassignedUsers = project.assignedTo.filter(u => !assignedUserIds.includes(u.id));
            return (
              <div key={task.id} className="flex items-start gap-3">
                <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => handleToggleTask(task.id)} className="mt-1" />
                <div className="flex-1">
                  <label htmlFor={`task-${task.id}`} className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</label>
                  <div className="flex items-center gap-2 mt-1">
                    {task.assignedTo?.map(user => (
                      <Avatar key={user.id} className="h-5 w-5">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                    {unassignedUsers.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-48">
                          <Command>
                            <CommandInput placeholder="Assign to..." />
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                              {unassignedUsers.map(u => (
                                <CommandItem key={u.id} onSelect={() => handleAssign(task, u.id)}>{u.name}</CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Add a new task..." value={taskText} onChange={e => setTaskText(e.target.value)} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon"><UserPlus className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56">
              <Command>
                <CommandInput placeholder="Assign users..." />
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {project.assignedTo.map(user => (
                    <CommandItem key={user.id} onSelect={() => {
                      const newSelection = selectedUsers.includes(user.id)
                        ? selectedUsers.filter(id => id !== user.id)
                        : [...selectedUsers, user.id];
                      setSelectedUsers(newSelection);
                    }}>
                      <Checkbox className="mr-2" checked={selectedUsers.includes(user.id)} />
                      {user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={handleAddTask} size="icon"><PlusCircle className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};