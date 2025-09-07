import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { NavItem } from '@/pages/NavigationSettingsPage';
import IconPicker from '../IconPicker';

interface EditNavItemDialogProps {
  item: NavItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string, url: string, icon?: string) => Promise<void>;
  isSaving: boolean;
}

const EditNavItemDialog = ({ item, open, onOpenChange, onSave, isSaving }: EditNavItemDialogProps) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setUrl(item.url);
      setIcon(item.icon || undefined);
    }
  }, [item]);

  const handleSave = () => {
    if (item) {
      onSave(item.id, name, url, icon);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Navigation Item</DialogTitle>
          <DialogDescription>Update the details for your custom navigation link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-icon">Icon</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Analytics Dashboard" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input id="edit-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/dashboard" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !url.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNavItemDialog;