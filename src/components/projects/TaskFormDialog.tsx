import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
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
  title: z.string().min(1, 'Judul harus diisi'),
  project_id: z.string({ required_error: "Proyek harus dipilih" }).uuid('Proyek harus dipilih'),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  priority: z.string().optional().nullable(),
  assignee_ids: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, task }: TaskFormDialogProps) => {
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: members = [], isLoading: isLoadingMembers } = useTeamMembers();

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

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({
      ...values,
      id: task?.id,
      title: values.title,
      project_id: values.project_id,
      due_date: values.due_date ? values.due_date.toISOString() : null,
    });
  };

  const userOptions = members.map(member => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}`.trim() || member.email || 'Pengguna Tidak Dikenal',
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Tugas' : 'Buat Tugas Baru'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., Rancang halaman utama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyek</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih proyek" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingProjects ? (
                        <SelectItem value="loading" disabled>Memuat proyek...</SelectItem>
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
              name="assignee_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ditugaskan kepada</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Pilih anggota tim..."
                      disabled={isLoadingMembers}
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
                  <FormLabel>Batas Waktu</FormLabel>
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
                            <span>Pilih tanggal</span>
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
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Simpan Perubahan' : 'Buat Tugas'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;