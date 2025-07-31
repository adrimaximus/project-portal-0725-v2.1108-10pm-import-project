"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Task, AssignedUser, Project } from "@/data/projects";
import { allUsers } from '@/data/users';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command';
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectProgressCardProps {
  project: Project;
  onUpdateTasks: (tasks: Task[]) => void;
}

export default function ProjectProgressCard({ project, onUpdateTasks }: ProjectProgressCardProps) {
  const [newTaskText, setNewTaskText] = useState('');

  const completedTasks = project.tasks.filter(task => task.completed).length;
  const progressPercentage = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdateTasks(updatedTasks);
  };

  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskText.trim(),
      status: 'To Do',
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: [],
      completed: false,
    };
    onUpdateTasks([...project.tasks, newTask]);
    setNewTaskText('');
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = project.tasks.filter(task => task.id !== taskId);
    onUpdateTasks(updatedTasks);
  };

  const handleAssignUser = (taskId: string, userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const assignedUser: AssignedUser = { ...user, role: 'Member' };

    const updatedTasks = project.tasks.map(task => {
      if (task.id === taskId) {
        const isAlreadyAssigned = task.assignedTo.some(u => u.id === userId);
        if (isAlreadyAssigned) {
          // Unassign
          return { ...task, assignedTo: task.assignedTo.filter(u => u.id !== userId) };
        } else {
          // Assign
          return { ...task, assignedTo: [...task.assignedTo, assignedUser] };
        }
      }
      return task;
    });
    onUpdateTasks(updatedTasks);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <div className="flex items-center gap-4 pt-2">
          <Progress value={progressPercentage} className="w-full" />
          <span className="text-sm font-medium text-muted-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <p className="text-sm text-muted-foreground">{completedTasks} of {project.tasks.length} tasks completed</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleToggleTask(task.id)}
              />
              <label
                htmlFor={`task-${task.id}`}
                className={cn("flex-grow text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}
              >
                {task.title}
              </label>
              <div className="flex items-center -space-x-2">
                {task.assignedTo.map(user => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Assign user..." />
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {allUsers.map(user => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => handleAssignUser(task.id, user.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              task.assignedTo.some(u => u.id === user.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask}><PlusCircle className="h-4 w-4 mr-2" /> Add Task</Button>
        </div>
      </CardContent>
    </Card>
  );
}