import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import IconPicker from '../goals/IconPicker';
import ColorPicker from '../goals/ColorPicker';
import { useDragScrollY } from '@/hooks/useDragScrollY';

export interface FolderData {
  id?: string;
  name: string;
  icon: string;
  color: string;
}

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<FolderData, 'id'>) => void;
  folder?: FolderData | null;
  isSaving: boolean;
}

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required."),
  icon: z.string().min(1, "An icon is required."),
  color: z.string().min(1, "A color is required."),
});

type FolderFormValues = z.infer<typeof folderSchema>;

const FolderFormDialog = ({ open, onOpenChange, onSave, folder, isSaving }: FolderFormDialogProps) => {
  const isEditMode = !!folder;
  const scrollRef = useDragScrollY<HTMLFormElement>();

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: '',
      icon: 'Folder',
      color: '#6b7280',
    },
  });

  useEffect(() => {
    if (open && folder) {
      form.reset(folder);
    } else if (open) {
      form.reset({ name: '', icon: 'Folder', color: '#6b7280' });
    }
  }, [folder, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
          <DialogDescription>
            Organize your custom navigation items into folders.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form ref={scrollRef} onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto cursor-grab active:cursor-grabbing select-none">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Folder Name</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Client Links" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl><ColorPicker color={field.value} setColor={field.onChange} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Folder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderFormDialog;