import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, User } from '@/types';
import { MultiSelect } from '../ui/multi-select';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  access_level: z.string(),
  collaborator_ids: z.array(z.string()).optional(),
});

interface FolderFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folder?: Folder | null;
}

const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email || 'No name',
          avatar_url: profile.avatar_url,
          email: profile.email,
          initials: getInitials(fullName) || 'NN',
        } as User;
      });
    },
  });
};

const FolderFormDialog = ({ isOpen, onOpenChange, folder }: FolderFormDialogProps) => {
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useProfiles();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Folder',
      color: '#6b7280',
      access_level: 'private',
      collaborator_ids: [],
    },
  });

  useEffect(() => {
    if (folder) {
      form.reset({
        name: folder.name,
        description: folder.description || '',
        icon: folder.icon || 'Folder',
        color: folder.color || '#6b7280',
        access_level: folder.access_level,
        collaborator_ids: folder.collaborators?.map(c => c.id) || [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        icon: 'Folder',
        color: '#6b7280',
        access_level: 'private',
        collaborator_ids: [],
      });
    }
  }, [folder, form]);

  const { mutate: upsertFolder, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase.rpc('upsert_folder_with_collaborators', {
        p_id: folder?.id || null,
        p_name: values.name,
        p_description: values.description,
        p_icon: values.icon,
        p_color: values.color,
        p_access_level: values.access_level,
        p_collaborator_ids: values.collaborator_ids,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(folder ? 'Folder updated' : 'Folder created');
      queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertFolder(values);
  };

  const userOptions = useMemo(() => profiles.map(p => {
    const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ');
    return {
      value: p.id,
      label: p.name,
      avatar_url: p.avatar_url,
      initials: getInitials(fullName)
    }
  }), [profiles]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'New Folder'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="access_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public_view">Public (View Only)</SelectItem>
                      <SelectItem value="public_edit">Public (View & Edit)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('access_level') === 'private' && (
              <FormField
                control={form.control}
                name="collaborator_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collaborators</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={userOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select collaborators..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderFormDialog;