import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ContactProperty } from '@/types';
import { Loader2 } from 'lucide-react';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (property: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url'>) => void;
  property?: ContactProperty | null;
  isSaving: boolean;
}

const propertySchema = z.object({
  label: z.string().min(1, "Label is required."),
  type: z.enum(['text', 'email', 'phone', 'url', 'date', 'textarea', 'number', 'image', 'select']),
  options: z.string().optional(),
}).refine(data => {
  if (data.type === 'select') {
    return data.options && data.options.trim().length > 0;
  }
  return true;
}, {
  message: "Options are required for dropdown type. Please provide a comma-separated list.",
  path: ['options'],
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const PropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving }: PropertyFormDialogProps) => {
  const isEditMode = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      label: '',
      type: 'text',
      options: '',
    }
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (open && property) {
      form.reset({
        label: property.label,
        type: property.type,
        options: property.options ? property.options.join(', ') : '',
      });
    } else if (open) {
      form.reset({
        label: '',
        type: 'text',
        options: '',
      });
    }
  }, [property, open, form]);

  const onSubmit = (values: PropertyFormValues) => {
    const machineName = values.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const propertyData: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url'> = {
      name: machineName,
      label: values.label,
      type: values.type,
    };

    if (values.type === 'select' && values.options) {
      propertyData.options = values.options.split(',').map(opt => opt.trim()).filter(Boolean);
    }

    onSave(propertyData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Property' : 'Create New Property'}</DialogTitle>
          <DialogDescription>
            Define a new field to store information about your contacts.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="label" render={({ field }) => (
              <FormItem>
                <FormLabel>Field Label</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Home Address" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Field Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a field type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {selectedType === 'select' && (
              <FormField control={form.control} name="options" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dropdown Options</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Option 1, Option 2, Option 3" />
                  </FormControl>
                  <FormDescription>
                    Enter comma-separated values for the dropdown options.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Property
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;