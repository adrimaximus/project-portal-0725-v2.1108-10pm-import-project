"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const personSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

type PersonFormData = z.infer<typeof personSchema>;

interface UpsertPersonSheetProps {
  person?: Person | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

export function UpsertPersonSheet({ person, isOpen, onOpenChange, onSave }: UpsertPersonSheetProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
  });

  useEffect(() => {
    form.reset({
      id: person?.id || null,
      full_name: person?.full_name || '',
      email: person?.contact?.emails?.[0] || person?.email || '',
      phone: (person?.contact as any)?.phones?.[0] || person?.phone || '',
      company: person?.company || '',
      job_title: person?.job_title || '',
      instagram: person?.social_media?.instagram || '',
      avatar_url: person?.avatar_url || null,
    });
  }, [person, form]);

  const { mutate: upsertPerson, isPending } = useMutation({
    mutationFn: async (values: PersonFormData) => {
      const { data, error } = await supabase.rpc('upsert_person_with_details', {
        p_id: values.id,
        p_full_name: values.full_name,
        p_contact: {
          emails: values.email ? [values.email] : [],
          phones: values.phone ? [values.phone] : [],
        },
        p_company: values.company,
        p_job_title: values.job_title,
        p_social_media: {
          instagram: values.instagram,
        },
        p_avatar_url: values.avatar_url,
        p_department: null,
        p_birthday: null,
        p_notes: null,
        p_project_ids: [],
        p_existing_tag_ids: [],
        p_custom_tags: null,
        p_address: null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(person ? 'Person updated successfully!' : 'Person created successfully!');
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onSave();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      form.setValue('avatar_url', data.publicUrl, { shouldValidate: true, shouldDirty: true });
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Error uploading avatar.');
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: PersonFormData) => {
    upsertPerson(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{person ? 'Edit Person' : 'Create New Person'}</SheetTitle>
          <SheetDescription>
            {person ? 'Update the details for this person.' : 'Enter the details for the new person.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={field.value || undefined} />
                      <AvatarFallback>
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1.5 flex-grow">
                      <Label htmlFor="avatar-upload">Upload Image</Label>
                      <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                      {uploading && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</div>}
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. john.doe@example.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 081234567890" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. https://instagram.com/username" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}