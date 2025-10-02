import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, X } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { value: string }[];
};

const propertySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['text', 'number', 'date', 'select']),
  options: z.array(z.object({ value: z.string().min(1, 'Option value is required') })).optional(),
}).refine(data => {
  if (data.type === 'select') {
    return data.options && data.options.length > 0;
  }
  return true;
}, {
  message: 'Select properties must have at least one option.',
  path: ['options'],
});

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');

const CompanyPropertiesDialog = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<CompanyProperty | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<CompanyProperty | null>(null);

  const { data: properties = [], isLoading } = useQuery<CompanyProperty[]>({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*').order('label');
      if (error) throw error;
      // The options are stored as a simple array of strings in Supabase.
      // react-hook-form's useFieldArray works better with an array of objects.
      return data.map(p => ({ ...p, options: p.options?.map(o => ({ value: o })) || [] }));
    },
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      label: '',
      type: 'text',
      options: [{ value: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const propertyType = watch('type');

  useEffect(() => {
    if (propertyToEdit) {
      reset({
        label: propertyToEdit.label,
        type: propertyToEdit.type,
        options: propertyToEdit.options?.length ? propertyToEdit.options : [{ value: '' }],
      });
      setIsFormVisible(true);
    } else {
      reset({ label: '', type: 'text', options: [{ value: '' }] });
    }
  }, [propertyToEdit, reset]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof propertySchema>) => {
      const options = values.type === 'select' ? values.options?.map(o => o.value) : null;

      if (propertyToEdit) {
        const record = {
          // name (slug) is not editable after creation
          label: values.label,
          type: values.type,
          options,
        };
        const { error } = await supabase.from('company_properties').update(record).eq('id', propertyToEdit.id);
        if (error) throw error;
      } else {
        const name = slugify(values.label);
        const record = {
          name,
          label: values.label,
          type: values.type,
          options,
        };
        const { error } = await supabase.from('company_properties').insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Property ${propertyToEdit ? 'updated' : 'added'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['company_properties'] });
      setIsFormVisible(false);
      setPropertyToEdit(null);
    },
    onError: (error: any) => {
      toast.error('Failed to save property.', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('company_properties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Property deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['company_properties'] });
      setPropertyToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete property.', { description: error.message });
    },
  });

  const onSubmit = (data: z.infer<typeof propertySchema>) => {
    mutation.mutate(data);
  };

  const handleAddNew = () => {
    setPropertyToEdit(null);
    reset({ label: '', type: 'text', options: [{ value: '' }] });
    setIsFormVisible(true);
  };

  const handleEdit = (prop: CompanyProperty) => {
    setPropertyToEdit(prop);
  };

  const handleDeleteConfirm = () => {
    if (propertyToDelete) {
      deleteMutation.mutate(propertyToDelete.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Company Properties</DialogTitle>
            <DialogDescription>Manage custom properties for your companies.</DialogDescription>
          </DialogHeader>
          
          {isFormVisible ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {propertyType === 'select' && (
                <div>
                  <Label>Options</Label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 mb-2">
                      <Input {...register(`options.${index}.value`)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>Add Option</Button>
                  {errors.options && <p className="text-sm text-destructive mt-1">{errors.options.root?.message}</p>}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setIsFormVisible(false); setPropertyToEdit(null); }}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {propertyToEdit ? 'Save Changes' : 'Add Property'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <div className="py-4">
                {isLoading ? (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : properties.length === 0 ? (
                  <p className="text-center text-muted-foreground">No custom properties defined yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {properties.map(prop => (
                      <li key={prop.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <span className="font-medium">{prop.label}</span>
                          <span className="text-sm text-muted-foreground ml-2 capitalize">({prop.type})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(prop)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setPropertyToDelete(prop)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Property</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{propertyToDelete?.label}" property. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompanyPropertiesDialog;