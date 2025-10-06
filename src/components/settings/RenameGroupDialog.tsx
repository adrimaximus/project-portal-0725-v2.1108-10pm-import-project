import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface RenameGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newGroupName: string) => Promise<void>;
  groupName: string | null;
}

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required.").toLowerCase().refine(name => name !== 'general', {
    message: "'general' is a reserved group name.",
  }),
});

type GroupFormValues = z.infer<typeof groupSchema>;

const RenameGroupDialog = ({ open, onOpenChange, onSave, groupName }: RenameGroupDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' }
  });

  useEffect(() => {
    if (open && groupName) {
      form.reset({ name: groupName });
    }
  }, [groupName, open, form]);

  const handleFormSubmit = async (values: GroupFormValues) => {
    if (values.name === groupName) {
        onOpenChange(false);
        return;
    }
    setIsSaving(true);
    await onSave(values.name);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Group</DialogTitle>
          <DialogDescription>
            This will rename the group for all associated tags.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Work" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameGroupDialog;