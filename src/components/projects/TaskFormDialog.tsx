import { useEffect, useMemo, useState } from 'react';
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
import { Task, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/types/task';
import { UpsertTaskPayload } from '@/hooks/useTaskMutations';
import { useTags } from '@/hooks/useTags';
import { TagInput } from '../goals/TagInput';
import { Tag } from '@/types/goal';
import { useTagMutations } from '@/hooks/useTagMutations';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  status: z.string().optional(),
  assignee_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, task }: TaskFormDialogProps) => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: allTags = [], refetch: refetchTags } = useTags();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(profile);
    }
    getUser();
  }, []);

  const queryClient = useQueryClient();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      project_id: '',
      description: '',
      due_date: null,
      priority: 'Normal',
      status: 'To do',
      assignee_ids: [],
      tag_ids: [],
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
        status: task.status,
        assignee_ids: task.assignees?.map(a => a.id) || [],
        tag_ids: task.tags?.map(t => t.id) || [],
      });
      setSelectedTags(task.tags || []);
    } else if (open && !task) {
      form.reset({
        title: '',
        project_id: '',
        description: '',
        due_date: null,
        priority: 'Normal',
        status: 'To do',
        assignee_ids: [],
        tag_ids: [],
      });
      setSelectedTags([]);
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

  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
    form.setValue('tag_ids', newTags.map(t => t.id));
  };

  const handleCreateTag = (tagName: string): Tag => {
    const newTag = {
      id: `new-${tagName}-${Date.now()}`,
      name: tagName,
      color: '#808080'
    };
    toast.info(`New tag "${tagName}" will be created upon saving.`);
    return newTag;
  };

  const handleSubmit = async (values: TaskFormValues) => {
    const finalTagIds: string[] = [];
    const newTagsToCreate = selectedTags.filter(t => t.id.startsWith('new-'));

    if (newTagsToCreate.length > 0) {
        const createTagPromises = newTagsToCreate.map(tag => 
            supabase.from('tags').insert({ name: tag.name, color: tag.color, user_id: currentUser?.id }).select().single()
        );
        const results = await Promise.all(createTagPromises);
        results.forEach(res => {
            if (res.error) {
                toast.error(`Failed to create tag: ${res.error.message}`);
                throw new Error(res.error.message);
            }
            if (res.data) {
                finalTagIds.push(res.data.id);
            }
        });
    }

    const existingTagIds = selectedTags.filter(t => !t.id.startsWith('new-')).map(t => t.id);
    finalTagIds.push(...existingTagIds);

    const payload: UpsertTaskPayload = {
      id: task?.id,
      title: values.title,
      project_id: values.project_id,
      description: values.description,
      due_date: values.due_date ? values.due_date.toISOString() : null,
      priority: values.priority,
      status: values.status,
      assignee_ids: values.assignee_ids,
      tag_ids: finalTagIds,
    };

    onSubmit(payload);
  };

  const userOptions = projectMembers.map(member => {
    const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
    return {
      value: member.id,
      label: fullName || (member.email ? member.email.split('@')[0] : 'Unknown User'),
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <TagInput
                allTags={allTags}
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                onTagCreate={handleCreateTag}
                onTagsUpdated={refetchTags}
                user={currentUser}
              />
            </FormItem>
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