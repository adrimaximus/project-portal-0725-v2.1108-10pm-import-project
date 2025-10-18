import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ContactProperty, Person } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import UserSelector from './UserSelector';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from './CompanySelector';

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
  const { user: currentUser } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<ContactProperty[]>({
    queryKey: ['contact_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*').order('label');
      if (error) throw error;
      return data;
    },
  });

  const filteredProperties = useMemo(() => {
    const redundantFieldNames = ['jabatan', 'posisi'];
    return properties.filter(prop => !redundantFieldNames.includes(prop.name.toLowerCase()));
  }, [properties]);

  const baseSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    company_id: z.string().uuid().optional().nullable(),
  });

  const [dynamicSchema, setDynamicSchema] = React.useState<z.AnyZodObject>(baseSchema);

  useEffect(() => {
    if (filteredProperties.length > 0) {
      const schema = filteredProperties.reduce((schema, prop) => {
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
    } else {
      setDynamicSchema(baseSchema);
    }
  }, [filteredProperties, baseSchema]);

  const { register, handleSubmit, reset, formState: { errors }, control } = useForm({
    resolver: zodResolver(dynamicSchema),
  });

  useEffect(() => {
    if (open) {
      if (person) { // Edit mode
        const { custom_properties, full_name, ...personData } = person;
        const nameParts = full_name ? full_name.split(' ') : [''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        reset({ ...personData, first_name: firstName, last_name: lastName, ...custom_properties, company_id: person.company_id });
      } else { // Create mode
        const profileForDefaults = selectedProfile;
        const defaultValues = filteredProperties.reduce((acc, prop) => ({ ...acc, [prop.name]: '' }), {});
        
        if (profileForDefaults) {
          reset({
            ...defaultValues,
            first_name: profileForDefaults.first_name || '',
            last_name: profileForDefaults.last_name || '',
            email: profileForDefaults.email || '',
            phone: profileForDefaults.phone || '',
            company_id: null,
          });
        } else {
          reset({ first_name: '', last_name: '', email: '', phone: '', company_id: null, ...defaultValues });
        }
      }
    } else {
      // Reset when dialog closes
      setSelectedProfile(null);
    }
  }, [person, open, reset, filteredProperties, selectedProfile]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master admin';
      const isEditingLinkedUser = person && person.user_id && isAdmin;

      const full_name = `${values.first_name || ''} ${values.last_name || ''}`.trim();

      const standardFields = ['first_name', 'last_name', 'email', 'phone', 'company_id', 'avatar_url'];
      const custom_properties: Record<string, any> = {};

      for (const key in values) {
        if (!standardFields.includes(key)) {
          custom_properties[key] = values[key];
        }
      }
      
      const contactJson = {
        emails: values.email ? [values.email] : [],
        phones: values.phone ? [values.phone] : [],
      };

      let rpcName = 'upsert_person_with_details';
      let rpcParams: any = {
        p_id: person?.id || null,
        p_full_name: full_name,
        p_contact: contactJson,
        p_company_id: values.company_id,
        p_job_title: person?.job_title || null,
        p_department: values.department,
        p_social_media: person?.social_media || {},
        p_birthday: values.birthday,
        p_notes: person?.notes || null,
        p_project_ids: person?.projects?.map(p => p.id) || [],
        p_existing_tag_ids: person?.tags?.map(t => t.id) || [],
        p_custom_tags: [],
        p_avatar_url: person?.avatar_url || (selectedProfile ? selectedProfile.avatar_url : null),
        p_address: person?.address || null,
        p_custom_properties: custom_properties,
      };

      if (isEditingLinkedUser) {
        rpcName = 'admin_update_person_details';
      }

      const { data, error } = await supabase.rpc(rpcName, rpcParams).single();
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
          <div className="grid grid-cols-2 gap-4 px-6">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && <p className="text-sm text-destructive mt-1">{errors.first_name.message as string}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register('last_name')} />
            </div>
          </div>
          <div className="px-6">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message as string}</p>}
          </div>
          <div className="px-6">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="px-6">
            <Label htmlFor="company">Company</Label>
            <Controller
              name="company_id"
              control={control}
              render={({ field }) => (
                <CompanySelector
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {isLoadingProperties ? (
            <div className="flex justify-center px-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filteredProperties.length > 0 && (
            <div className="space-y-4 border-t pt-4 mt-4 px-6">
              <h3 className="text-lg font-medium">Custom Properties</h3>
              {filteredProperties.map(prop => (
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