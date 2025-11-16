import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, X, PlusCircle } from 'lucide-react';
import { CustomProperty, CUSTOM_PROPERTY_TYPES } from '@/types';
import { Label } from '@/components/ui/label';

const createPropertySchema = (properties: CustomProperty[], property: CustomProperty | null) => z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(CUSTOM_PROPERTY_TYPES),
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
  if (data.type === 'select') {
    if (!data.options || data.options.length === 0 || data.options.every(opt => opt.value.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'For "Select" type, at least one option with a value is required.',
        path: ['options'],
      });
    }
  }
});

export type PropertyFormValues = z.infer<ReturnType<typeof createPropertySchema>>;
export type SavedPropertyFormValues = Omit<PropertyFormValues, 'options'> & { options?: string[] | null };

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  property: CustomProperty | null;
  onSave: (data: SavedPropertyFormValues) => void;
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
      options: [{ value: '' }],
    },
  });

  const { register, handleSubmit, control, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const propertyType = watch('type');

  useEffect(() => {
    if (open) {
      if (property) {
        form.reset({
          label: property.label,
          type: property.type,
          options: property.options?.map(o => ({ value: o })) || [{ value: '' }],
        });
      } else {
        form.reset({ label: '', type: 'text', options: [{ value: '' }] });
      }
    }
  }, [property, open, form]);

  const onSubmit = (values: PropertyFormValues) => {
    onSave({
      ...values,
      options: values.options?.map(o => o.value).filter(Boolean) || null,
    });
  };

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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

            {propertyType === 'select' && (
              <div>
                <Label>Options</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-2">
                    <div className="flex items-center gap-2">
                      <Input {...register(`options.${index}.value`)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.options?.[index]?.value && (
                      <p className="text-sm text-destructive mt-1">{(errors.options[index] as any).value.message}</p>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
                {errors.options && !Array.isArray(errors.options) && <p className="text-sm text-destructive mt-1">{errors.options.message}</p>}
              </div>
            )}

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