import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ContactProperty, Person } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import UserSelector from './UserSelector';
import { useAuth } from '@/contexts/AuthContext';

// Minimal profile type definition to avoid touching global types.ts
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface PeopleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  onSuccess?: (person: Person) => void;
}

const PeopleFormDialog = ({ open, onOpenChange, person, onSuccess }: PeopleFormDialogProps) => {
  const queryClient = useQueryClient();
  const { user: currentUser, session } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<ContactProperty[]>({
    queryKey: ['contact_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*').order('label');
      if (error) throw error;
      return data;
    },
  });

  const baseSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    job_title: z.string().optional(),
    avatar_url: z.string().url().optional().or(z.literal('')),
    notes: z.string().optional(),
    address: z.string().optional(),
  });

  const [dynamicSchema, setDynamicSchema] = React.useState<z.AnyZodObject>(baseSchema);

  useEffect(() => {
    if (properties.length > 0) {
      const schema = properties.reduce((schema, prop) => {
        let fieldSchema;
        switch (prop.type) {
          case 'number':
            fieldSchema = z.coerce.number().optional();
            break;
          case 'date':
            fieldSchema = z.string().optional();
            break;
          default:
            fieldSchema = z.string().optional();
        }
        return schema.extend({ [prop.name]: fieldSchema });
      }, baseSchema);
      setDynamicSchema(schema);
    }
  }, [properties, baseSchema]);

  const { register, handleSubmit, reset, formState: { errors }, control } = useForm({
    resolver: zodResolver(dynamicSchema),
  });

  const profileToUse = useMemo(() => {
    if (person) return null; // Edit mode, no pre-fill
    if (selectedProfile) return selectedProfile;
    return currentUser as unknown as Profile | null;
  }, [person, selectedProfile, currentUser]);

  useEffect(() => {
    if (open) {
      if (person) { // Edit mode
        const { custom_properties, ...personData } = person;
        reset({ ...personData, ...custom_properties });
      } else { // Create mode
        const profileForDefaults = selectedProfile || (currentUser as unknown as Profile | null);
        const defaultValues = properties.reduce((acc, prop) => ({ ...acc, [prop.name]: '' }), {});
        
        if (profileForDefaults) {
          reset({
            ...defaultValues,
            full_name: `${profileForDefaults.first_name || ''} ${profileForDefaults.last_name || ''}`.trim(),
            email: profileForDefaults.email || session?.user?.email || '',
            phone: profileForDefaults.phone || '',
            company: '',
            job_title: '',
            avatar_url: profileForDefaults.avatar_url || '',
            notes: '',
            address: '',
          });
        } else {
          reset({ full_name: '', email: session?.user?.email || '', phone: '', company: '', job_title: '', avatar_url: '', notes: '', address: '', ...defaultValues });
        }
      }
    } else {
      // Reset when dialog closes
      setSelectedProfile(null);
    }
  }, [person, open, reset, properties, selectedProfile, currentUser, session]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const standardFields = ['full_name', 'email', 'phone', 'company', 'job_title', 'avatar_url', 'notes', 'address'];
      const personData: Partial<Person> = {};
      const custom_properties: Record<string, any> = {};

      for (const key in values) {
        if (standardFields.includes(key)) {
          personData[key] = values[key];
        } else {
          custom_properties[key] = values[key];
        }
      }
      personData.custom_properties = custom_properties;

      let data, error;
      if (person) {
        ({ data, error } = await supabase.from('people').update(personData).eq('id', person.id).select().single());
      } else {
        ({ data, error } = await supabase.from('people').insert(personData as any).select().single());
      }
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Person ${person ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      if (onSuccess) {
        onSuccess(data as Person);
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save person.', { description: getErrorMessage(error) });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const renderField = (prop: ContactProperty) => {
    const fieldName = prop.name;
    switch (prop.type) {
      case 'number':
        return <Input id={fieldName} type="number" {...register(fieldName)} />;
      case 'date':
        return <Input id={fieldName} type="date" {...register(fieldName)} />;
      default:
        return <Input id={fieldName} {...register(fieldName)} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
          <DialogDescription>Fill in the details for the person.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-6 py-4 -mx-6">
          {!person && (
            <div className="px-6 pb-4 border-b">
              <Label>Pre-fill from User Profile</Label>
              <UserSelector onSelectUser={setSelectedProfile} />
              <p className="text-xs text-muted-foreground mt-1">
                Fields with existing data will be locked. You can fill in any empty fields.
              </p>
            </div>
          )}
          <div className="px-6">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" {...register('full_name')} readOnly={!!(profileToUse && `${profileToUse.first_name || ''} ${profileToUse.last_name || ''}`.trim())} />
            {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message as string}</p>}
          </div>
          <div className="px-6">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register('email')} readOnly={!!(profileToUse && profileToUse.email) || !!(!person && !selectedProfile && session?.user?.email)} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message as string}</p>}
          </div>
          <div className="px-6">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} readOnly={!!(profileToUse && profileToUse.phone)} />
          </div>
          <div className="px-6">
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register('company')} />
          </div>
          <div className="px-6">
            <Label htmlFor="job_title">Job Title</Label>
            <Input id="job_title" {...register('job_title')} />
          </div>
          <div className="px-6">
            <Label htmlFor="address">Address</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <AddressAutocompleteInput
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="px-6">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input id="avatar_url" {...register('avatar_url')} readOnly={!!(profileToUse && profileToUse.avatar_url)} />
            {errors.avatar_url && <p className="text-sm text-destructive mt-1">{errors.avatar_url.message as string}</p>}
          </div>
          <div className="px-6">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>

          {isLoadingProperties ? (
            <div className="flex justify-center px-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : properties.length > 0 && (
            <div className="space-y-4 border-t pt-4 mt-4 px-6">
              <h3 className="text-lg font-medium">Custom Properties</h3>
              {properties.map(prop => (
                <div key={prop.id}>
                  <Label htmlFor={prop.name}>{prop.label}</Label>
                  {renderField(prop)}
                </div>
              ))}
            </div>
          )}
        
          <DialogFooter className="pt-4 sticky bottom-0 bg-background px-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {person ? 'Save Changes' : 'Create Person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleFormDialog;