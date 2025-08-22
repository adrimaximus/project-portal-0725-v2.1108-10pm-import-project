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
import { Loader2, Globe, Lock, Users, Copy } from 'lucide-react';
import { KbFolder, FolderAccessLevel, User } from '@/types';
import IconPicker from '../goals/IconPicker';
import ColorPicker from '../goals/ColorPicker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { MultiSelect } from '../ui/multi-select';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: KbFolder;
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

const EditFolderDialog = ({ open, onOpenChange, folder, onSuccess }: EditFolderDialogProps) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder.name,
      description: folder.description || '',
      icon: folder.icon || 'Folder',
      color: folder.color || '#6b7280',
      category: folder.category || '',
      access_level: folder.access_level || 'private',
    },
  });

  const fetchCollaborators = useCallback(async () => {
    const { data } = await supabase.from('kb_folder_collaborators').select('user_id').eq('folder_id', folder.id);
    if (data) setCollaboratorIds(data.map(c => c.user_id));
  }, [folder.id]);

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
      fetchCollaborators();
    }
  }, [open, fetchCollaborators]);

  const onSubmit = async (values: FolderFormValues) => {
    if (!user) return;
    setIsSaving(true);

    const { error: updateError } = await supabase.from('kb_folders').update({
      name: values.name,
      description: values.description,
      icon: values.icon,
      color: values.color,
      category: values.category,
      access_level: values.access_level,
    }).eq('id', folder.id);

    if (updateError) {
      toast.error("Failed to update folder.", { description: updateError.message });
      setIsSaving(false);
      return;
    }

    // Manage collaborators
    const currentIds = new Set(collaboratorIds);
    const { data: existingCollaborators } = await supabase.from('kb_folder_collaborators').select('user_id').eq('folder_id', folder.id);
    const existingIds = new Set((existingCollaborators || []).map(c => c.user_id));
    
    const toAdd = collaboratorIds.filter(id => !existingIds.has(id));
    const toRemove = Array.from(existingIds).filter(id => !currentIds.has(id));

    if (toAdd.length > 0) {
      await supabase.from('kb_folder_collaborators').insert(toAdd.map(uid => ({ folder_id: folder.id, user_id: uid })));
    }
    if (toRemove.length > 0) {
      await supabase.from('kb_folder_collaborators').delete().eq('folder_id', folder.id).in('user_id', toRemove);
    }

    setIsSaving(false);
    toast.success("Folder updated successfully.");
    onSuccess();
    onOpenChange(false);
  };

  const shareLink = `${window.location.origin}/knowledge-base/folders/${folder.slug}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>Update details and manage access for this folder.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Folder Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Internal Docs" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem><FormLabel>Icon</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} color={form.watch('color')} /></FormControl><FormMessage /></FormItem>
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
                </RadioGroup></FormItem>
              )} />
              {form.watch('access_level') !== 'private' && (
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

            <DialogFooter className="pt-4 sticky bottom-0 bg-background -mx-6 px-6 pb-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFolderDialog;