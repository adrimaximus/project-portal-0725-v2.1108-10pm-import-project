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
import { format, addHours } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { Task, TaskStatus, Tag, User as Profile, Project, TaskAttachment, UpsertTaskPayload, TaskPriority } from '@/types';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/data/projectOptions';
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
import { v4 as uuidv4 } from 'uuid';
import { formatMentions } from '@/lib/mentionUtils';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpsertTaskPayload) => void;
  isSubmitting: boolean;
  task?: Task | null;
  project?: Project | null;
  initialData?: Partial<UpsertTaskPayload>;
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_id: z.string().uuid("Please select a project.").optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  priority: z.enum(TASK_PRIORITY_OPTIONS.map(o => o.value) as [TaskPriority, ...TaskPriority[]]).optional().nullable(),
  status: z.enum(TASK_STATUS_OPTIONS.map(o => o.value) as [TaskStatus, ...TaskStatus[]]).optional(),
  assignee_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TICKET_TAG_NAME = 'Ticket';

const TaskFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, task, project, initialData }: TaskFormDialogProps) => {
  const isMobile = useIsMobile();
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ excludeOtherPersonal: true });
  
  const projectsForCombobox = useMemo(() => {
    const hookProjects = projectsData?.pages.flatMap(page => page.projects) ?? [];
    const projectsMap = new Map<string, Project>();

    if (project) {
      projectsMap.set(project.id, project);
    }

    if (task && task.project_id) {
      if (!projectsMap.has(task.project_id)) {
        projectsMap.set(task.project_id, {
          id: task.project_id,
          name: task.project_name || 'Unknown Project',
          slug: task.project_slug || '',
        } as Project);
      }
    }

    hookProjects.forEach(p => {
      if (!projectsMap.has(p.id)) {
        projectsMap.set(p.id, p);
      }
    });

    return Array.from(projectsMap.values());
  }, [projectsData, project, task]);

  const { data: allTags = [], refetch: refetchTags } = useTags();
  const { data: allProfiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { user: currentUser } = useAuth();
  const [assignableUsers, setAssignableUsers] = useState<Profile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [previousStatus, setPreviousStatus] = useState<TaskStatus>('To do');

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
    if (selectedProjectId && projectsForCombobox.length > 0 && allProfiles.length > 0) {
      const selectedProject = projectsForCombobox.find((p: Project) => p.id === selectedProjectId);
      if (selectedProject) {
        if (selectedProject.slug === 'general-tasks' || selectedProject.personal_for_user_id) {
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
  }, [selectedProjectId, projectsForCombobox, allProfiles]);

  const directTaskAttachments = useMemo(() => {
    return (task?.attachments || []).filter(f => !filesToDelete.includes(f.id));
  }, [task, filesToDelete]);

  const ticketAttachments = useMemo(() => {
    if (!task?.ticket_attachments) return [];
    return task.ticket_attachments.filter(f => !filesToDelete.includes(f.id));
  }, [task, filesToDelete]);

  const allExistingAttachments: TaskAttachment[] = useMemo(() => {
    let combined = [...directTaskAttachments];
    
    if (ticketAttachments.length > 0) {
        const existingUrls = new Set(combined.map(a => a.file_url));
        const uniqueTicketAttachments = ticketAttachments.filter(
            (ticketAtt) => !existingUrls.has(ticketAtt.file_url)
        );
        combined = [...combined, ...uniqueTicketAttachments];
    }
    
    return combined;
  }, [directTaskAttachments, ticketAttachments]);

  useEffect(() => {
    if (open) {
      if (isLoadingProjects || isLoadingProfiles) {
        return;
      }
      setNewFiles([]);
      setFilesToDelete([]);
      
      if (task) { // EDIT MODE
        let initialTags = [...(task.tags || [])];
        const isTicketByTag = initialTags.some(t => t.name === TICKET_TAG_NAME);
        const isTicketByOrigin = !!task.origin_ticket_id;

        if (isTicketByOrigin && !isTicketByTag) {
            const ticketTagInOptions = allTags.find(t => t.name === TICKET_TAG_NAME);
            if (ticketTagInOptions) {
                initialTags.push(ticketTagInOptions);
            } else {
                const syntheticTicketTag: Tag = {
                    id: `new-${TICKET_TAG_NAME}-${uuidv4()}`,
                    name: TICKET_TAG_NAME,
                    color: '#DB2777',
                    isNew: true,
                    user_id: task.created_by.id,
                };
                initialTags.push(syntheticTicketTag);
            }
        }

        form.reset({
          title: task.title,
          project_id: task.project_id || project?.id,
          description: formatMentions(task.description),
          due_date: task.due_date ? new Date(task.due_date) : null,
          priority: task.priority || 'Normal',
          status: task.status || 'To do',
          assignee_ids: task.assignedTo?.map(a => a.id) || [],
          tag_ids: initialTags.map(t => t.id),
        });
        setSelectedTags(initialTags);
        if (task.status && task.status !== 'Done') {
          setPreviousStatus(task.status);
        } else {
          setPreviousStatus('To do');
        }
      } else { // CREATE MODE
        const personalProject = projectsForCombobox.find(p => p.personal_for_user_id === currentUser?.id);
        const generalTasksProject = projectsForCombobox.find(p => p.slug === 'general-tasks');
        
        const initialProjectId = project?.id || initialData?.project_id || personalProject?.id || generalTasksProject?.id || '';

        let initialDueDate = initialData?.due_date ? new Date(initialData.due_date) : null;
        let initialTags: Tag[] = [];

        const isFromTicket = !!initialData?.origin_ticket_id;

        if (isFromTicket) {
          initialDueDate = addHours(new Date(), 24);

          const ticketTagInOptions = allTags.find(t => t.name === TICKET_TAG_NAME);
          if (ticketTagInOptions) {
            initialTags.push(ticketTagInOptions);
          } else {
            const syntheticTicketTag: Tag = {
              id: `new-${TICKET_TAG_NAME}-${uuidv4()}`,
              name: TICKET_TAG_NAME,
              color: '#DB2777',
              isNew: true,
              user_id: currentUser?.id || '',
            };
            initialTags.push(syntheticTicketTag);
          }
        }

        form.reset({
          title: initialData?.title || '',
          project_id: initialProjectId,
          description: formatMentions(initialData?.description || ''),
          due_date: initialDueDate,
          priority: initialData?.priority || 'Normal',
          status: initialData?.status || 'To do',
          assignee_ids: initialData?.assignee_ids || [],
          tag_ids: initialTags.map(t => t.id),
        });
        setSelectedTags(initialTags);
        setPreviousStatus('To do');
      }
    }
  }, [task, open, form, projectsForCombobox, project, currentUser, allTags, initialData, isLoadingProjects, isLoadingProfiles]);

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

  const isTicketChecked = useMemo(() => 
    selectedTags.some(t => t.name === TICKET_TAG_NAME),
    [selectedTags]
  );

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

    let projectId = values.project_id;

    if (!projectId || projectId === '') {
        const personalProject = projectsForCombobox.find(p => p.personal_for_user_id === currentUser?.id);
        if (personalProject) {
            projectId = personalProject.id;
        } else {
            toast.error("A project is required to create a task. Please select one.");
            return;
        }
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
      origin_ticket_id: task?.origin_ticket_id || initialData?.origin_ticket_id,
    };

    onSubmit(payload);
  };

  const formContent = (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="project_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project</FormLabel>
            <ProjectCombobox
              projects={projectsForCombobox}
              value={field.value || ''}
              onChange={field.onChange}
              isLoading={isLoadingProjects}
              disabled={!!task || !!project}
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
            allProfiles.filter(user => (field.value || []).includes(user.id)),
            [field.value, allProfiles]
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
        render={({ field }) => {
          const handleDateSelect = (day: Date | undefined) => {
            if (!day) {
              field.onChange(null);
              return;
            }
            const currentVal = field.value || new Date();
            const newDate = new Date(day);
            newDate.setHours(currentVal.getHours());
            newDate.setMinutes(currentVal.getMinutes());
            field.onChange(newDate);
          };

          const handleTimeChange = (part: 'h' | 'm' | 'p', value: string) => {
            const date = field.value || new Date();
            let h = date.getHours();
            let m = date.getMinutes();

            let currentPeriod = h >= 12 ? 'PM' : 'AM';
            let currentHour12 = h % 12;
            if (currentHour12 === 0) currentHour12 = 12;

            let newHour12 = currentHour12;
            let newMinute = m;
            let newPeriod = currentPeriod;

            if (part === 'h') newHour12 = parseInt(value);
            if (part === 'm') newMinute = parseInt(value);
            if (part === 'p') newPeriod = value as 'AM' | 'PM';

            let newHour24 = newHour12;
            if (newPeriod === 'PM' && newHour12 < 12) {
              newHour24 += 12;
            }
            if (newPeriod === 'AM' && newHour12 === 12) {
              newHour24 = 0;
            }

            const newDate = new Date(date);
            newDate.setHours(newHour24, newMinute, 0, 0);
            field.onChange(newDate);
          };

          const hour = field.value ? field.value.getHours() : 0;
          const minute = field.value ? field.value.getMinutes() : 0;
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 === 0 ? 12 : hour % 12;

          return (
            <FormItem>
              <FormLabel>Due Date & Time</FormLabel>
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
                        format(field.value, "PPP p")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center justify-center gap-2">
                      <Select
                        value={String(displayHour)}
                        onValueChange={(value) => handleTimeChange('h', value)}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                            <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">:</span>
                      <Select
                        value={String(minute).padStart(2, '0')}
                        onValueChange={(value) => handleTimeChange('m', value)}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={period}
                        onValueChange={(value) => handleTimeChange('p', value)}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormItem>
        <FormLabel>Attachments</FormLabel>
        <TaskFileUpload
          existingFiles={allExistingAttachments}
          deletableFileIds={directTaskAttachments.map(f => f.id)}
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
</dyad-file>

<dyad-write path="src/components/projects/TasksKanbanColumn.tsx">
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import TasksKanbanCard from './TasksKanbanCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_STATUS_OPTIONS } from '@/data/projectOptions';

interface TasksKanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TasksKanbanColumn = ({ status, tasks, isCollapsed, onToggleCollapse, onEdit, onDelete }: TasksKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  const statusLabel = TASK_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out h-full flex flex-col bg-muted/50 rounded-lg max-h-[700px]",
        isCollapsed ? "w-14" : "w-72"
      )}
    >
      <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <h3 className="flex items-center gap-2 truncate">
            <span className="truncate">{statusLabel}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
          </h3>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(status)}>
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {isCollapsed ? (
        <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer p-3" onClick={() => onToggleCollapse(status)}>
          <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{statusLabel}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </div>
      ) : (
        <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
          <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TasksKanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No tasks</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksKanbanColumn;