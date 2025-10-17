import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn, getTaskStatusStyles, getPriorityStyles } from '@/lib/utils';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { Task, TaskStatus, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, Tag, User as Profile, Project } from '@/types';
import { UpsertTaskPayload } from '@/hooks/useTaskMutations';
import { useTags } from '@/hooks/useTags';
import { TagsMultiselect } from '@/components/ui/TagsMultiselect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfiles } from '@/hooks/useProfiles';
import { useIsMobile } from '@/hooks/use-mobile';
import TaskFileUpload from './TaskFileUpload';
import { Badge } from '@/components/ui/badge';
import { ProjectCombobox } from './ProjectCombobox';
import { Checkbox } from '@/components/ui/checkbox';
import { AssigneeCombobox } from './AssigneeCombobox';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpsertTaskPayload) => void;
  isSubmitting: boolean;
  task?: Task | null;
  project?: Project | null;
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  priority: z.string().optional().nullable(),
  status: z.string().optional(),
  assignee_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, task, project }: TaskFormDialogProps) => {
  const isMobile = useIsMobile();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: allTags = [], refetch: refetchTags } = useTags();
  const { data: allProfiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { user: currentUser } = useAuth();
  const [assignableUsers, setAssignableUsers] = useState<Profile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [previousStatus, setPreviousStatus] = useState<TaskStatus>('To do');
  const TICKET_TAG_NAME = 'Ticket';

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

  const selectedProjectId = useWatch({ control: form.control, name: 'project_id' });

  useEffect(() => {
    if (selectedProjectId && projects.length > 0 && allProfiles.length > 0) {
      const selectedProject = projects.find((p: Project) => p.id === selectedProjectId);
      if (selectedProject) {
        if (selectedProject.slug === 'general-tasks') {
          setAssignableUsers(allProfiles);
        } else {
          const memberIds = selectedProject.assignedTo?.map(m => m.id) || [];
          const projectMembers = allProfiles.filter(p => memberIds.includes(p.id));
          setAssignableUsers(projectMembers);
        }
      }
    } else if (!selectedProjectId) {
        setAssignableUsers([]);
    }
  }, [selectedProjectId, projects, allProfiles]);

  useEffect(() => {
    if (open) {
      setNewFiles([]);
      setFilesToDelete([]);
      if (task) {
        form.reset({
          title: task.title,
          project_id: task.project_id,
          description: task.description,
          due_date: task.due_date ? new Date(task.due_date) : null,
          priority: task.priority || 'Normal',
          status: task.status,
          assignee_ids: task.assignedTo?.map(a => a.id) || [],
          tag_ids: task.tags?.map(t => t.id) || [],
        });
        setSelectedTags(task.tags || []);
        if (task.status !== 'Done') {
          setPreviousStatus(task.status);
        } else {
          setPreviousStatus('To do');
        }
      } else {
        const generalTasksProject = projects.find(p => p.slug === 'general-tasks');
        form.reset({
          title: '',
          project_id: project?.id || generalTasksProject?.id || '',
          description: '',
          due_date: null,
          priority: 'Normal',
          status: 'To do',
          assignee_ids: [],
          tag_ids: [],
        });
        setSelectedTags([]);
        setPreviousStatus('To do');
      }
    }
  }, [task, open, form, projects, project]);

  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
    form.setValue('tag_ids', newTags.map(t => t.id));
  };

  const handleCreateTag = (tagName: string): Tag => {
    const newTag = {
      id: `new-${tagName}-${Date.now()}`,
      name: tagName,
      color: tagName === TICKET_TAG_NAME ? '#DB2777' : '#808080',
      isNew: true,
      user_id: currentUser?.id,
    };
    toast.info(`New tag "${tagName}" will be created upon saving.`);
    return newTag;
  };

  const handleIsTicketChange = (checked: boolean) => {
    const ticketTagInOptions = allTags.find(t => t.name === TICKET_TAG_NAME);
    
    if (checked) {
      const tagToAdd = ticketTagInOptions || handleCreateTag(TICKET_TAG_NAME);
      if (!selectedTags.some(st => st.name === TICKET_TAG_NAME)) {
        handleTagsChange([...selectedTags, tagToAdd]);
      }
    } else {
      handleTagsChange(selectedTags.filter(t => t.name !== TICKET_TAG_NAME));
    }
  };

  const handleExistingFileDelete = (fileId: string) => {
    setFilesToDelete(prev => [...prev, fileId]);
  };

  const handleSubmit = async (values: TaskFormValues) => {
    const finalTagIds: string[] = [];
    const newTagsToCreate = selectedTags.filter(t => t.isNew);

    if (newTagsToCreate.length > 0) {
        const createTagPromises = newTagsToCreate.map(tag => 
            supabase.rpc('create_tag', { p_name: tag.name, p_color: tag.color }).select().single()
        );
        const results = await Promise.all(createTagPromises);
        for (const res of results) {
            if (res.error) {
                toast.error(`Failed to create tag: ${res.error.message}`);
                throw new Error(res.error.message);
            }
            if (res.data) {
                finalTagIds.push(res.data.id);
            }
        }
    }

    const existingTagIds = selectedTags.filter(t => !t.isNew).map(t => t.id);
    finalTagIds.push(...existingTagIds);

    let generalTasksProject = projects.find(p => p.slug === 'general-tasks');
    let projectId = values.project_id;

    if (!projectId || projectId === '') {
        if (generalTasksProject) {
            projectId = generalTasksProject.id;
        } else {
            const { data: generalProjectId, error } = await supabase
                .rpc('ensure_general_tasks_project_and_membership');

            if (error) {
                toast.error(`Could not access default project: ${error.message}. Please select a project manually.`);
                return;
            }
            
            projectId = generalProjectId;
        }
    }

    if (!projectId) {
      toast.error("A project is required to create a task. Please select one.");
      return;
    }

    const payload: UpsertTaskPayload = {
      id: task?.id,
      completed: values.status === 'Done',
      project_id: projectId,
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: values.status,
      assignee_ids: values.assignee_ids,
      due_date: values.due_date ? values.due_date.toISOString() : null,
      tag_ids: finalTagIds,
      new_files: newFiles,
      deleted_files: filesToDelete,
    };

    onSubmit(payload);
  };

  const isTicketChecked = useMemo(() => 
    selectedTags.some(t => t.name === TICKET_TAG_NAME),
    [selectedTags, TICKET_TAG_NAME]
  );

  const formContent = (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="project_id"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Project</FormLabel>
            <ProjectCombobox
              projects={projects}
              value={field.value || ''}
              onChange={field.onChange}
              isLoading={isLoadingProjects}
              disabled={!!project}
            />
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
      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <FormControl>
          <Checkbox
            checked={isTicketChecked}
            onCheckedChange={handleIsTicketChange}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel>
            Is Ticket
          </FormLabel>
          <FormDescription>
            Marking this task as a ticket will help in filtering and reporting.
          </FormDescription>
        </div>
      </FormItem>
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
              <Select
                onValueChange={(value: TaskStatus) => {
                  field.onChange(value);
                  if (value !== 'Done') {
                    setPreviousStatus(value);
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    {field.value ? (
                      <Badge variant="outline" className={cn(getTaskStatusStyles(field.value).tw, 'border-0 font-normal')}>
                        {TASK_STATUS_OPTIONS.find(opt => opt.value === field.value)?.label}
                      </Badge>
                    ) : (
                      <SelectValue placeholder="Select status" />
                    )}
                  </SelectTrigger>
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
                  <SelectTrigger>
                    {field.value ? (
                      <Badge variant="outline" className={cn(getPriorityStyles(field.value).tw, 'text-xs')}>
                        {TASK_PRIORITY_OPTIONS.find(opt => opt.value === field.value)?.label}
                      </Badge>
                    ) : (
                      <SelectValue placeholder="Select priority" />
                    )}
                  </SelectTrigger>
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
        render={({ field }) => {
          const selectedUsers = useMemo(() => 
            assignableUsers.filter(user => (field.value || []).includes(user.id)),
            [field.value, assignableUsers]
          );

          return (
            <FormItem>
              <FormLabel>Assignees</FormLabel>
              <FormControl>
                <AssigneeCombobox
                  users={assignableUsers}
                  selectedUsers={selectedUsers}
                  onChange={(newSelectedUsers: Profile[]) => {
                    field.onChange(newSelectedUsers.map(u => u.id));
                  }}
                  disabled={isLoadingProfiles || !selectedProjectId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormItem>
        <FormLabel>Tags</FormLabel>
        <TagsMultiselect
          options={allTags}
          value={selectedTags}
          onChange={handleTagsChange}
          onTagCreate={handleCreateTag}
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
      <FormItem>
        <FormLabel>Attachments</FormLabel>
        <TaskFileUpload
          existingFiles={(task?.attachments || []).filter(f => !filesToDelete.includes(f.id))}
          newFiles={newFiles}
          onNewFilesChange={setNewFiles}
          onExistingFileDelete={handleExistingFileDelete}
        />
      </FormItem>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{task ? 'Edit Task' : 'Create New Task'}</DrawerTitle>
            <DrawerDescription>
              {task ? "Edit the details of your task." : "Fill in the details to create a new task."}
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="px-4 overflow-y-auto max-h-[60vh]">
                {formContent}
              </div>
              <DrawerFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {task ? 'Save Changes' : 'Create Task'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? "Edit the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
              {formContent}
            </div>
            <DialogFooter className="pt-4">
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