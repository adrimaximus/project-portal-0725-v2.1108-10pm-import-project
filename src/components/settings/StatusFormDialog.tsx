import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StatusFormValues {
  name: string;
  color: string;
}

interface StatusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StatusFormValues) => Promise<void>;
  initialData?: StatusFormValues | null;
  isSaving?: boolean;
}

const PRESET_COLORS = [
  '#94a3b8', // Slate
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

const StatusFormDialog: React.FC<StatusFormDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#94a3b8');

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setColor(initialData?.color || '#94a3b8');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Status' : 'New Status'}</DialogTitle>
            <DialogDescription>
              {initialData 
                ? 'Update the status details. This will update all projects currently using this status.' 
                : 'Create a new status for your projects.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. In Progress"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 p-1 cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-1 flex-wrap mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border border-gray-200 ${color === c ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusFormDialog;