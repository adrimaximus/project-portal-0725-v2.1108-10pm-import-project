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
import { CustomProperty, Person } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import UserSelector from './UserSelector';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from './CompanySelector';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import AvatarUpload from './AvatarUpload';
import CustomPropertyInput from '../settings/CustomPropertyInput';
import { useDragScrollY } from '@/hooks/useDragScrollY';

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
  const scrollRef = useDragScrollY<HTMLDivElement>();
  
  const isLinkedUser = !!person?.user_id;

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CustomProperty[]>({
    queryKey: ['custom_properties', 'contact'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'contact');
      if (error) throw error;
      return data;
    },
  });

  const filteredProperties = useMemo(() => {
    const redundantFieldNames = [
      'jabatan',
      'posisi',
      'country',
      'department',
      'email',
      'full_name',
      'home_address_instagram',
      'job_title',
      'job_titles',
      'notes',
      'phone',
      'phone_number',
      'website'
    ];
    return properties.filter(
      (prop) => !prop.is_default && !redundantFieldNames.includes(prop.name.toLowerCase())
    );
  }, [properties]);

  const baseSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().nullable(),
    company_id: z.string().uuid().optional().nullable(),
    job_title: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable().or(z.literal('')),
    birthday: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    custom_properties: z.record(z.any()).optional(),
  });

  type PropertyFormValues = z.infer<typeof baseSchema>;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_id: null,
      job_title: '',
      department: '',
      avatar_url: '',
      birthday: '',
      notes: '',
      custom_properties: {},
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = form;
  const watchedFirstName = watch('first_name');
  const watchedLastName = watch('last_name');
  const watchedEmail = watch('email');

  useEffect(() => {
    if (open) {
      if (person) {
        const { custom_properties, full_name, ...personData } = person;
        const nameParts = full_name ? full_name.split(' ') : [''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        reset({
          ...personData,
          first_name: firstName,
          last_name: lastName,
          custom_properties: custom_properties || {},
          company_id: person.company_id,
          birthday: person.birthday
            ? new Date(person.birthday).toISOString().split('T')[0]
            : '',
        });
      } else {
        reset({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company_id: null,
          job_title: '',
          department: '',
          avatar_url: '',
          birthday: '',
          notes: '',
          custom_properties: {
            website: 'https://',
          },
        });
      }
    } else {
      setSelectedProfile(null);
    }
  }, [person, open, reset]);

  useEffect(() => {
    if (selectedProfile && !person) {
      setValue('first_name', selectedProfile.first_name || '', { shouldValidate: true });
      setValue('last_name', selectedProfile.last_name || '', { shouldValidate: true });
      setValue('email', selectedProfile.email || '', { shouldValidate: true });
      setValue('phone', selectedProfile.phone || '', { shouldValidate: true });
    }
  }, [selectedProfile, person, setValue]);

  const mutation = useMutation<Person, Error, PropertyFormValues>({
    mutationFn: async (values: PropertyFormValues): Promise<Person> => {
      if (selectedProfile && !person) {
        const { data: existingPerson, error: fetchError } = await supabase
          .from('people')
          .select('id')
          .eq('user_id', selectedProfile.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingPerson) {
          throw new Error('A person record for this user already exists.');
        }
      }

      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master admin';
      const isEditingLinkedUser = person && person.user_id && isAdmin;

      let full_name = `${values.first_name || ''} ${values.last_name || ''}`.trim();
      if (!full_name && values.email) {
        full_name = values.email.split('@')[0];
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
        p_job_title: values.job_title || null,
        p_department: values.department || null,
        p_social_media: person?.social_media || {},
        p_birthday: values.birthday || null,
        p_notes: values.notes || null,
        p_project_ids: person?.projects?.map((p) => p.id) || [],
        p_existing_tag_ids: person?.tags?.map((t) => t.id) || [],
        p_custom_tags: [],
        p_avatar_url: values.avatar_url || (selectedProfile ? selectedProfile.avatar_url : null),
        p_address: person?.address || null,
        p_custom_properties: values.custom_properties,
      };

      if (isEditingLinkedUser) {
        rpcName = 'admin_update_person_details';
      }

      const { data, error } = await supabase.rpc(rpcName, rpcParams).single();
      if (error) throw error;
      const resultData = data as any;

      if (selectedProfile && !person) {
        const { error: updateError } = await supabase
          .from('people')
          .update({ user_id: selectedProfile.id })
          .eq('id', resultData.id);

        if (updateError) {
          throw updateError;
        }
        resultData.user_id = selectedProfile.id;
      }

      return resultData as Person;
    },
    onSuccess: (data) => {
      toast.success(`Person ${person ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onSuccess?.(data);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save person.', { description: getErrorMessage(error) });
    },
  });

  const onSubmit = (data: PropertyFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg grid grid-rows-[auto_1fr_auto] max-h-[80vh] p-0">
        {/* HEADER */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
          <DialogDescription>Fill in the details for the person.</DialogDescription>
        </DialogHeader>

        {/* SCROLL AREA */}
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 cursor-grab active:cursor-grabbing select-none">
            <Form {...form}>
              <form id="person-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {!person && (
                  <div className="pb-4 border-b">
                    <Label>Pre-fill from User Profile</Label>
                    <UserSelector onSelectUser={setSelectedProfile} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Fields with existing data will be locked. You can fill in any empty fields.
                    </p>
                  </div>
                )}

                {/* FORM FIELDS */}
                <FormField
                  control={control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar</FormLabel>
                      <FormControl>
                        <AvatarUpload
                          value={field.value || null}
                          onChange={field.onChange}
                          storagePath="people"
                          name={`${watchedFirstName || ''} ${watchedLastName || ''}`}
                          email={watchedEmail || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Basic info */}
                <FormField control={control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} disabled={!!selectedProfile || isLinkedUser} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} disabled={!!selectedProfile || isLinkedUser} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} disabled={!!selectedProfile || isLinkedUser} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} disabled={!!selectedProfile || isLinkedUser} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="company_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl><CompanySelector value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="job_title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., Marketing Manager" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} placeholder="e.g., Sales" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="birthday" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ''} placeholder="Add any relevant notes here..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Custom properties */}
                {isLoadingProperties ? (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : filteredProperties.length > 0 && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium">Custom Properties</h3>
                    {filteredProperties.map((prop) => (
                      <Controller
                        key={prop.id}
                        control={control}
                        name={`custom_properties.${prop.name}`}
                        render={({ field }) => (
                          <FormItem>
                            <CustomPropertyInput
                              property={prop}
                              control={control}
                              name={`custom_properties.${prop.name}`}
                              bucket="people"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}
              </form>
            </Form>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="person-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {person ? 'Save Changes' : 'Create Person'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleFormDialog;