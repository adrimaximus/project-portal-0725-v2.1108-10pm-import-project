import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import IconPicker from '@/components/goals/IconPicker';
import ColorPicker from '@/components/goals/ColorPicker';
import { allIcons } from '@/data/icons';
import { colors } from '@/data/colors';

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  folder?: { id: string; name: string; description: string; icon: string; color: string } | null;
}

const FolderFormDialog = ({ open, onOpenChange, onSuccess, folder }: FolderFormDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [color, setColor] = useState('#141414');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (folder) {
        setName(folder.name);
        setDescription(folder.description || '');
        setIcon(folder.icon || 'Folder');
        setColor(folder.color || '#141414');
      } else {
        setName('');
        setDescription('');
        setIcon(allIcons[Math.floor(Math.random() * allIcons.length)]);
        setColor(colors[Math.floor(Math.random() * colors.length)]);
      }
    }
  }, [open, folder]);

  const handleSave = async () => {
    if (!name.trim() || !user) {
      toast.error("Folder name is required.");
      return;
    }
    setIsSaving(true);

    const folderData = {
      name,
      description,
      icon,
      color,
    };

    const promise = folder
      ? supabase.from('kb_folders').update(folderData).eq('id', folder.id)
      : supabase.from('kb_folders').insert(folderData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save folder.", { description: error.message });
    } else {
      toast.success(`Folder "${name}" ${folder ? 'updated' : 'created'}.`);
      onSuccess();
      onOpenChange(false);
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
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker color={color} setColor={setColor} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderFormDialog;