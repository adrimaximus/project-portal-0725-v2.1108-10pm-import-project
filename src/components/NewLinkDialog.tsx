import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (label: string, url: string) => void;
}

const NewLinkDialog = ({ open, onOpenChange, onAddLink }: NewLinkDialogProps) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (label.trim() && url.trim()) {
      onAddLink(label, url);
      onOpenChange(false);
      setLabel('');
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new link</DialogTitle>
          <DialogDescription>
            Create a custom link in your sidebar to embed any website. Note: Some websites may block being embedded.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Label
            </Label>
            <Input
              id="name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Company Blog"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              URL
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!label.trim() || !url.trim()}>
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewLinkDialog;