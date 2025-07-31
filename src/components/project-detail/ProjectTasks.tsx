import { useState } from 'react';
import { Task, User } from '@/data/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ProjectTasksProps {
  tasks: Task[];
  team: User[];
  onAddTask: (taskTitle: string) => void;
  onToggleTask: (taskId: string) => void;
  onAssignUserToTask: (taskId: string, user: User) => void;
}

export function ProjectTasks({
  tasks,
  team,
  onAddTask,
  onToggleTask,
  onAssignUserToTask,
}: ProjectTasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Tasks</h3>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={() => onToggleTask(task.id)}
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
            >
              {task.title}
            </label>
            <div className="flex items-center -space-x-2">
              {task.assignedTo?.map(user => (
                <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {team.map(user => (
                  <DropdownMenuItem key={user.id} onSelect={() => onAssignUserToTask(task.id, user)}>
                    {task.assignedTo?.some(u => u.id === user.id) ? 'Unassign' : 'Assign'} {user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <Button onClick={handleAddTask}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}