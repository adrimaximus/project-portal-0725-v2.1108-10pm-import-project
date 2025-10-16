import { useState, useEffect } from "react";
import { Task, User, Reaction } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Plus, MoreHorizontal, Edit, Trash2, SmilePlus } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import toast from 'react-hot-toast';

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  onTasksUpdate: () => void;
}

const EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '😢', '🤔'];

const ProjectTasks = ({ tasks, onAddTask, onEditTask, onDeleteTask, onToggleTaskCompletion, onTasksUpdate }: ProjectTasksProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleReactionClick = async (task: Task, emoji: string) => {
    setOpenPopoverId(null); // Close popover immediately
    if (!session?.user) return;

    // Call the database function first
    const { error } = await supabase.rpc('toggle_task_reaction', {
      p_task_id: task.id,
      p_emoji: emoji,
    });

    if (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Gagal memperbarui reaksi.", { description: error.message });
    } else {
      // After the database is updated, refetch the data to update the UI
      onTasksUpdate();
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <ListChecks className="mx-auto h-12 w-12" />
        <p className="mt-4">No tasks for this project yet.</p>
        <Button onClick={onAddTask} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add First Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-4">
        <Button onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <TooltipProvider>
        {tasks.map((task) => {
          const groupedReactions = task.reactions?.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = [];
            }
            acc[reaction.emoji].push(reaction);
            return acc;
          }, {} as Record<string, Reaction[]>);

          return (
            <div key={task.id} className="p-2 rounded-md hover:bg-muted group">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm break-words ${task.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}
                  >
                    {task.title}
                  </label>
                </div>

                <div className="flex items-center gap-2 ml-auto pl-2 flex-shrink-0">
                  <div className="flex items-center space-x-1 flex-wrap">
                    {groupedReactions && Object.entries(groupedReactions).map(([emoji, reactions]) => {
                      const userHasReacted = reactions.some(r => r.user_id === session?.user?.id);
                      return (
                        <Tooltip key={emoji}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={userHasReacted ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 px-2 rounded-full"
                              onClick={() => handleReactionClick(task, emoji)}
                            >
                              <span className="mr-1 text-sm">{emoji}</span>
                              <span className="text-xs">{reactions.length}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{reactions.map(r => r.user_name).join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                    <Popover open={openPopoverId === task.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? task.id : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-50 group-hover:opacity-100 transition-opacity">
                          <SmilePlus className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1">
                        <div className="flex space-x-1">
                          {EMOJIS.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => handleReactionClick(task, emoji)}
                            >
                              <span className="text-lg">{emoji}</span>
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center -space-x-2">
                    {task.assignedTo?.map((assignee: User) => (
                      <Tooltip key={assignee.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={assignee.avatar_url} alt={assignee.name} />
                            <AvatarFallback>{assignee.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{assignee.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEditTask(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDeleteTask(task)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </TooltipProvider>
    </div>
  );
};

export default ProjectTasks;