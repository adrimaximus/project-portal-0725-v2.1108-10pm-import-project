import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CustomProperty, CUSTOM_PROPERTY_TYPES } from '@/types';
import { Loader2, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const propertySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  name: z.string().min(1, 'Name is required').regex(/^[a-z0-9_]+$/, 'Name can only contain lowercase letters, numbers, and underscores.'),
  type: z.enum(CUSTOM_PROPERTY_TYPES),
  options: z.array(z.string()).optional(),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PropertyFormValues) => void;
  property: CustomProperty | null;
  isSaving: boolean;
  properties: CustomProperty[];
}

const PropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving, properties }: PropertyFormDialogProps) => {
  const isEditMode = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema.superRefine((data, ctx) => {
      const machineName = data.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (properties.some(p => p.name === machineName && p.id !== property?.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A property with this name already exists. Please use a different label.',
          path: ['label'],
        });
      }
    })),
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
        form.reset(property);
      } else {
        form.reset({ label: '', name: '', type: 'text' });
      }
    }
  }, [property, open, form]);

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
      <DialogContent className="sm:max-w-md">
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
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="multi-image">Multi-Image</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multi-select">Multi-Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
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