import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useProjects } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Project, Task, User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  project?: Project | null;
}

const taskSchema = z.object({
  title: z.string().min(1, "Title is required."),
  project_id: z.string().min(1, "Project is required."),
  description: z.string().optional(),
  due_date: z.date().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignee_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const TaskFormDialog = ({ open, onOpenChange, task, project }: TaskFormDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { members: allProfiles, isLoading: isLoadingProfiles } = useTeamMembers();
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!task;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      project_id: '',
      description: '',
      priority: 'normal',
      assignee_ids: [],
    }
  });

  const selectedProjectId = form.watch('project_id');

  useEffect(() => {
    if (selectedProjectId && projects.length > 0 && allProfiles.length > 0) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        if (selectedProject.slug === 'general-tasks') {
          setAssignableUsers(allProfiles);
        } else {
          const memberIds = selectedProject.assignedTo?.map(m => m.id) || [];
          const projectMembers = allProfiles.filter(p => memberIds.includes(p.id));
          setAssignableUsers(projectMembers);
        }
      }
    }
  }, [selectedProjectId, projects, allProfiles]);

  useEffect(() => {
    if (open) {
      if (isEditMode && task) {
        form.reset({
          title: task.title,
          project_id: task.project_id,
          description: task.description || '',
          due_date: task.due_date ? new Date(task.due_date) : undefined,
          priority: task.priority,
          assignee_ids: task.assignees?.map(a => a.id) || [],
        });
      } else if (project) {
        form.reset({
          title: '',
          project_id: project.id,
          description: '',
          priority: 'normal',
          assignee_ids: [],
        });
      } else {
        const generalTasksProject = projects.find(p => p.slug === 'general-tasks');
        form.reset({
          title: '',
          project_id: generalTasksProject?.id || '',
          description: '',
          priority: 'normal',
          assignee_ids: [],
        });
      }
    }
  }, [open, isEditMode, task, project, form, projects]);

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      toast.error("You must be logged in to save a task.");
      return;
    }
    setIsSaving(true);
    try {
      const taskData = {
        project_id: values.project_id,
        title: values.title,
        description: values.description,
        due_date: values.due_date?.toISOString(),
        priority: values.priority,
        created_by: user.id,
      };

      let taskId = task?.id;

      if (isEditMode) {
        const { error } = await supabase.from('tasks').update(taskData).eq('id', taskId!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('tasks').insert(taskData).select('id').single();
        if (error) throw error;
        taskId = data.id;
      }

      // Handle assignees
      if (taskId && values.assignee_ids) {
        // Remove all existing assignees
        const { error: deleteError } = await supabase.from('task_assignees').delete().eq('task_id', taskId);
        if (deleteError) console.error("Error clearing assignees:", deleteError);

        // Add new assignees
        if (values.assignee_ids.length > 0) {
          const newAssignees = values.assignee_ids.map(userId => ({ task_id: taskId, user_id: userId }));
          const { error: insertError } = await supabase.from('task_assignees').insert(newAssignees);
          if (insertError) throw insertError;
        }
      }

      toast.success(`Task ${isEditMode ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.slug] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} task: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of this task.' : 'Add a new task to a project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="project_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!project}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingProjects ? (
                      <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                    ) : (
                      projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Design new landing page" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} placeholder="Add more details about the task..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="assignee_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Assignees</FormLabel>
                <AssigneeMultiSelect
                  users={assignableUsers}
                  selectedUserIds={field.value || []}
                  onChange={field.onChange}
                  isLoading={isLoadingProfiles}
                  disabled={!selectedProjectId}
                />
                {!selectedProjectId && <p className="text-xs text-muted-foreground">Please select a project to see assignees.</p>}
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// AssigneeMultiSelect component
interface AssigneeMultiSelectProps {
  users: User[];
  selectedUserIds: string[];
  onChange: (ids: string[]) => void;
  isLoading: boolean;
  disabled: boolean;
}

const AssigneeMultiSelect = ({ users, selectedUserIds, onChange, isLoading, disabled }: AssigneeMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (userId: string) => {
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onChange(newSelectedIds);
  };

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedUsers.length > 0 ? selectedUsers.map(u => u.name).join(', ') : "Select assignees..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>{isLoading ? "Loading..." : "No users found."}</CommandEmpty>
          <CommandGroup>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.name}
                onSelect={() => handleSelect(user.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TaskFormDialog;