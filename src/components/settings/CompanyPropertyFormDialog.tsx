import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CustomProperty, CUSTOM_PROPERTY_TYPES } from '@/types';
import { Loader2, X } from 'lucide-react';

interface CompanyPropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (property: Omit<CustomProperty, 'id' | 'category'> & { name: string }) => void;
  property?: CustomProperty | null;
  isSaving: boolean;
  properties: CustomProperty[];
}

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

type PropertyFormValues = z.infer<ReturnType<typeof createPropertySchema>>;

const CompanyPropertyFormDialog = ({ open, onOpenChange, onSave, property, isSaving, properties }: CompanyPropertyFormDialogProps) => {
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
    const slug = values.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    onSave({
      name: slug,
      label: values.label,
      type: values.type,
      options: values.options?.map(o => o.value).filter(Boolean) || null,
      is_default: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Company Property' : 'Create New Company Property'}</DialogTitle>
          <DialogDescription>
            Define a new field to store information about your companies.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" {...register('label')} />
            {errors.label && <p className="text-sm text-destructive mt-1">{errors.label.message}</p>}
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
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
              )}
            />
          </div>

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
                    <p className="text-sm text-destructive mt-1">{errors.options[index].value.message}</p>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>Add Option</Button>
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
      </DialogContent>
    </Dialog>
  );
};

export default CompanyPropertyFormDialog;