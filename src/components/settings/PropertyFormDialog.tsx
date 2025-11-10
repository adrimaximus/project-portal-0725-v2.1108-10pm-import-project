import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { CustomProperty, CUSTOM_PROPERTY_TYPES } from '@/types';

const createPropertySchema = (properties: CustomProperty[], property: CustomProperty | null) => z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(CUSTOM_PROPERTY_TYPES),
}).superRefine((data, ctx) => {
  const machineName = data.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (properties.some(p => p.name === machineName && p.id !== property?.id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A property with this name already exists. Please use a different label.',
      path: ['label'],
    });
  }
});

export type PropertyFormValues = z.infer<ReturnType<typeof createPropertySchema>>;

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  property: CustomProperty | null;
  onSave: (data: PropertyFormValues) => void;
  isSaving: boolean;
  properties: CustomProperty[];
}

const PropertyFormDialog = ({ open, onOpenChange, property, onSave, isSaving, properties }: PropertyFormDialogProps) => {
  const isEditMode = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(createPropertySchema(properties, property)),
    defaultValues: {
      label: '',
      type: 'text',
    },
  });

  useEffect(() => {
    if (open) {
      if (property) {
        form.reset({
          label: property.label,
          type: property.type,
        });
      } else {
        form.reset({ label: '', type: 'text' });
      }
    }
  }, [property, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Property' : 'New Property'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify the details of your custom property.' : 'Create a new custom field for your records.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
            <FormField
              control={form.control}
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
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUSTOM_PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Property'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;