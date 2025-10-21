import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactProperty } from '@/types';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url'>) => void;
  property: ContactProperty | null;
  isSaving: boolean;
}

const propertySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  name: z.string().min(1, 'Name is required').regex(/^[a-z0-9_]+$/, 'Name can only contain lowercase letters, numbers, and underscores.'),
  type: z.enum(['text', 'number', 'date', 'image']),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const PropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving }: PropertyFormDialogProps) => {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      label: '',
      name: '',
      type: 'text',
    }
  });

  const { control, handleSubmit, reset, setValue, watch } = form;
  const labelValue = watch('label');

  useEffect(() => {
    if (open) {
      if (property) {
        reset(property);
      } else {
        reset({ label: '', name: '', type: 'text' });
      }
    }
  }, [property, open, reset]);

  useEffect(() => {
    if (!property) { // Only auto-generate name for new properties
      const newName = labelValue?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || '';
      setValue('name', newName, { shouldValidate: true });
    }
  }, [labelValue, setValue, property]);

  const onSubmit = (data: PropertyFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'New Property'}</DialogTitle>
          <DialogDescription>Define a new custom field for your contacts.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} id="property-form" className="space-y-4">
            <FormField
              control={control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl><Input {...field} readOnly={!!property} /></FormControl>
                  <p className="text-xs text-muted-foreground mt-1">This is the internal name used in the database. It cannot be changed.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="property-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;