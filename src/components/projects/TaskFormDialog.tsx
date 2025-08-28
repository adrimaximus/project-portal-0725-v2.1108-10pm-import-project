import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { MultiSelect } from '@/components/ui/multi-select';
import { Task } from '@/types/task';
import { UpsertTaskPayload } from '@/hooks/useTaskMutations';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpsertTaskPayload) => void;
  isSubmitting: boolean;
  task?: Task | null;
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_id: z.string({ required_error: "Project is required" }).uuid('Project is required'),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  priority: z.string().optional().nullable(),
  assignee_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, task }: TaskFormDialogProps) => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      project_id: '',
      description: '',
      due_date: null,
      priority: 'normal',
      assignee_ids: [],
    },
  });

  const selectedProjectId = form.watch('project_id');

  const projectMembers = useMemo(() => {
    if (!selectedProjectId || projects.length === 0) return [];
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.assignedTo || [];
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title,
        project_id: task.project_id,
        description: task.description,
        due_date: task.due_date ? new Date(task.due_date) : null,
        priority: task.priority,
        assignee_ids: task.assignees?.map(a => a.id) || [],
      });
    } else if (open && !task) {
      form.reset({
        title: '',
        project_id: '',
        description: '',
        due_date: null,
        priority: 'normal',
        assignee_ids: [],
      });
    }
  }, [task, open, form]);

  useEffect(() => {
    if (selectedProjectId) {
      const currentAssignees = form.getValues('assignee_ids') || [];
      const memberIds = new Set(projectMembers.map(m => m.id));
      const validAssignees = currentAssignees.filter(id => memberIds.has(id));
      if (validAssignees.length !== currentAssignees.length) {
        form.setValue('assignee_ids', validAssignees, { shouldValidate: true });
      }
    }
  }, [selectedProjectId, projectMembers, form]);


  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({
      ...values,
      id: task?.id,
      title: values.title,
      project_id: values.project_id,
      due_date: values.due_date ? values.due_date.toISOString() : null,
    });
  };

  const userOptions = projectMembers.map(member => ({
    value: member.id,
    label: [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || 'Unknown User',
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? "Edit the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!task || isLoadingProjects}>
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
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Design the main page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a more detailed description..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignee_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select team members..."
                      disabled={!selectedProjectId || isLoadingProjects}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
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
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;