import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ContactProperty } from '@/types';
import { Loader2 } from 'lucide-react';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (property: Omit<ContactProperty, 'id' | 'is_default'>) => void;
  property?: ContactProperty | null;
  isSaving: boolean;
}

const propertySchema = z.object({
  label: z.string().min(1, "Label is required."),
  type: z.enum(['text', 'email', 'phone', 'url', 'date', 'textarea', 'number']),
  company_logo_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const PropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving }: PropertyFormDialogProps) => {
  const isEditMode = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
  });

  useEffect(() => {
    if (open && property) {
      form.reset({
        label: property.label,
        type: property.type,
        company_logo_url: property.company_logo_url || '',
      });
    } else if (open) {
      form.reset({
        label: '',
        type: 'text',
        company_logo_url: '',
      });
    }
  }, [property, open, form]);

  const onSubmit = (values: PropertyFormValues) => {
    const machineName = values.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    onSave({
      ...property,
      name: machineName,
      label: values.label,
      type: values.type,
      company_logo_url: values.company_logo_url,
    });
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
            <FormField control={form.control} name="company_logo_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Logo URL</FormLabel>
                <FormControl><Input {...field} placeholder="https://example.com/logo.png" /></FormControl>
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
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
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