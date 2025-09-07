import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KbFolder, Profile } from '@/types';

// Use intersection type to handle inconsistencies in the KbFolder type
type DetailedKbFolder = KbFolder & { collaborators?: { id: string }[] };

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: DetailedKbFolder | null;
}

export default function FolderFormDialog({ open, onOpenChange, folder }: FolderFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (folder) {
        setName(folder.name);
        setDescription(folder.description || '');
        setCollaboratorIds(folder.collaborators?.map(c => c.id) || []);
      } else {
        setName('');
        setDescription('');
        setCollaboratorIds([]);
      }
    }
  }, [folder, open]);

  const { data: allUsers = [] } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const userOptions: Option[] = allUsers.map(user => ({
    value: user.id,
    label: `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unnamed User',
  }));

  const { mutate: upsertFolder, isPending } = useMutation({
    mutationFn: async () => {
      // Placeholder for mutation logic
      console.log('Upserting folder', { name, description, collaboratorIds, id: folder?.id });
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast.success(folder ? 'Folder updated' : 'Folder created');
      queryClient.invalidateQueries({ queryKey: ['kb_folders'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to save folder: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (name.trim()) {
      upsertFolder();
    } else {
      toast.error('Folder name is required.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Collaborators</Label>
            <MultiSelect
              options={userOptions}
              selected={userOptions.filter(option => collaboratorIds.includes(option.value))}
              onChange={(selectedOptions) => setCollaboratorIds(selectedOptions.map(option => option.value))}
              placeholder="Invite people..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}