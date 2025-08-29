import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Globe, Lock, Users, Copy, Pencil } from 'lucide-react';
import { KbFolder, FolderAccessLevel, User } from '@/types';
import IconPicker from '../goals/IconPicker';
import ColorPicker from '../goals/ColorPicker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { MultiSelect } from '../ui/multi-select';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { allIcons } from '@/data/icons';
import { CategoryInput } from './CategoryInput';

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: KbFolder | null;
  onSuccess: () => void;
}

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required."),
  description: z.string().optional(),
  icon: z.string(),
  color: z.string(),
  category: z.string().optional(),
  access_level: z.string(),
});

type FolderFormValues = z.infer<typeof folderSchema>;

const FolderFormDialog = ({ open, onOpenChange, folder, onSuccess }: FolderFormDialogProps) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);
  const [hasManuallySelectedIcon, setHasManuallySelectedIcon] = useState(false);

  const isEditMode = !!folder;

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
  });

  const titleValue = form.watch('name');

  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedIcon && titleValue && titleValue.length > 3) {
      const handler = setTimeout(async () => {
        setIsSuggestingIcon(true);
        try {
          const { data, error } = await supabase.functions.invoke('ai-handler', {
            body: {
              feature: 'suggest-icon',
              payload: { title: titleValue, icons: allIcons }
            }
          });
          if (error) throw error;
          if (data.result && allIcons.includes(data.result)) {
            form.setValue('icon', data.result);
          }
        } catch (err) {
          console.error("Icon suggestion failed:", err);
        } finally {
          setIsSuggestingIcon(false);
        }
      }, 500);

      return () => clearTimeout(handler);
    }
  }, [titleValue, isEditMode, hasManuallySelectedIcon, form]);

  const fetchCollaborators = useCallback(async () => {
    if (!folder) return;
    const { data } = await supabase.from('kb_folder_collaborators').select('user_id').eq('folder_id', folder.id);
    if (data) setCollaboratorIds(data.map(c => c.user_id));
  }, [folder]);

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
        if (data) {
          setAllUsers(data.map(p => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
            email: p.email,
            avatar: p.avatar_url,
            initials: getInitials(`${p.first_name || ''} ${p.last_name || ''}`.trim(), p.email)
          })));
        }
      };
      fetchUsers();

      if (isEditMode && folder) {
        form.reset({
          name: folder.name,
          description: folder.description || '',
          icon: folder.icon || 'Folder',
          color: folder.color || '#6b7280',
          category: folder.category || '',
          access_level: folder.access_level || 'private',
        });
        setHasManuallySelectedIcon(true);
        fetchCollaborators();
      } else {
        form.reset({
          name: '',
          description: '',
          icon: 'Folder',
          color: '#6b7280',
          category: '',
          access_level: 'private',
        });
        setHasManuallySelectedIcon(false);
        setCollaboratorIds([]);
      }
    }
  }, [open, folder, isEditMode, form, fetchCollaborators]);

  const onSubmit = async (values: FolderFormValues) => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase.rpc('upsert_folder_with_collaborators', {
      p_id: folder?.id || null,
      p_name: values.name,
      p_description: values.description,
      p_icon: values.icon,
      p_color: values.color,
      p_category: values.category,
      p_access_level: values.access_level,
      p_collaborator_ids: collaboratorIds,
    });

    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save folder: ${error.message}`);
    } else {
      toast.success(isEditMode ? "Folder updated successfully." : "Folder created successfully.");
      onSuccess();
      onOpenChange(false);
    }
  };

  const shareLink = folder ? `${window.location.origin}/knowledge-base/folders/${folder.slug}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update details and manage access for this folder.' : 'Organize your articles by creating a new folder.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Folder Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <CategoryInput 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Icon
                  {isSuggestingIcon && <Loader2 className="h-4 w-4 animate-spin" />}
                </FormLabel>
                <FormControl>
                  <IconPicker
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setHasManuallySelectedIcon(true);
                    }}
                    color={form.watch('color')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem><FormLabel>Color</FormLabel><FormControl><ColorPicker color={field.value} setColor={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold">Sharing & Permissions</h3>
              <FormField control={form.control} name="access_level" render={({ field }) => (
                <FormItem><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center gap-3"><Lock className="h-4 w-4" /><FormControl><RadioGroupItem value="private" id="private" /></FormControl><Label htmlFor="private">Private (only collaborators)</Label></div>
                  <div className="flex items-center gap-3"><Globe className="h-4 w-4" /><FormControl><RadioGroupItem value="public_view" id="public_view" /></FormControl><Label htmlFor="public_view">Anyone with the link can view</Label></div>
                  <div className="flex items-center gap-3"><Pencil className="h-4 w-4" /><FormControl><RadioGroupItem value="public_edit" id="public_edit" /></FormControl><Label htmlFor="public_edit">Anyone with the link can edit</Label></div>
                </RadioGroup></FormItem>
              )} />
              {isEditMode && form.watch('access_level') !== 'private' && (
                <div className="flex items-center gap-2 pl-7">
                  <Input value={shareLink} readOnly />
                  <Button type="button" size="icon" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Link copied!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-3"><Users className="h-4 w-4" /> Collaborators</Label>
              <MultiSelect
                options={allUsers.filter(u => u.id !== user?.id).map(u => ({ value: u.id, label: u.name }))}
                value={collaboratorIds}
                onChange={setCollaboratorIds}
                placeholder="Invite people..."
              />
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-background -mx-4 -mb-4 px-4 pb-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderFormDialog;