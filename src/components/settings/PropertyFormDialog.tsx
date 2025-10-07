import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ContactProperty } from '@/types';
import { Loader2, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (property: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url' | 'options'> & { options?: string[] | null }) => void;
  property?: ContactProperty | null;
  isSaving: boolean;
  properties: ContactProperty[];
}

const PropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving, properties }: PropertyFormDialogProps) => {
  const isEditMode = !!property;

  const propertySchema = z.object({
    label: z.string().min(1, "Label is required."),
    type: z.enum(['text', 'email', 'phone', 'url', 'date', 'textarea', 'number', 'image', 'select', 'multi-select', 'checkbox']),
    options: z.array(z.object({ value: z.string() })).optional(),
  }).superRefine((data, ctx) => {
    const machineName = data.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (properties.some(p => p.name === machineName && p.id !== property?.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A property with this name already exists. Please use a different label.',
        path: ['label'],
      });
    }

    if (data.type === 'select' || data.type === 'multi-select') {
      if (!data.options || data.options.length === 0 || data.options.every(opt => opt.value.trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'For "Select" type, at least one option with a value is required.',
          path: ['options'],
        });
      }
    }
  });

  type PropertyFormValues = z.infer<typeof propertySchema>;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      label: '',
      type: 'text',
      options: [{ value: '' }],
    }
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });
  const selectedType = form.watch('type');

  useEffect(() => {
    if (open && property) {
      form.reset({
        label: property.label,
        type: property.type,
        options: Array.isArray(property.options) ? property.options.map((opt: any) => ({ value: typeof opt === 'string' ? opt : opt.value })) : [{ value: '' }],
      });
    } else if (open) {
      form.reset({
        label: '',
        type: 'text',
        options: [{ value: '' }],
      });
    }
  }, [property, open, form]);

  const onSubmit = (values: PropertyFormValues) => {
    const machineName = values.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const saveData: Omit<ContactProperty, 'id' | 'is_default' | 'company_logo_url' | 'options'> & { options?: string[] | null } = {
      name: machineName,
      label: values.label,
      type: values.type,
    };

    if ((values.type === 'select' || values.type === 'multi-select') && values.options) {
      saveData.options = values.options.map(opt => opt.value).filter(Boolean);
    } else {
      saveData.options = null;
    }
    
    onSave(saveData);
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
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {(selectedType === 'select' || selectedType === 'multi-select') && (
              <div>
                <Label>Options</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-2">
                    <div className="flex items-center gap-2">
                      <Input {...form.register(`options.${index}.value`)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.formState.errors.options?.[index]?.value && (
                      <p className="text-sm text-destructive mt-1">{(form.formState.errors.options as any)[index].value.message}</p>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>Add Option</Button>
                {form.formState.errors.options && !Array.isArray(form.formState.errors.options) && <p className="text-sm text-destructive mt-1">{form.formState.errors.options.message}</p>}
              </div>
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