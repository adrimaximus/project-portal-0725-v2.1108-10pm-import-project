import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Person, Project, Tag, ContactProperty } from '@/types';
import { MultiSelect } from '../ui/multi-select';
import PhoneNumberInput from '../PhoneNumberInput';
import AntDatePicker from './AntDatePicker';

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
}

const personSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal('')),
  twitter: z.string().url("Invalid URL").optional().or(z.literal('')),
  instagram: z.string().url("Invalid URL").optional().or(z.literal('')),
  birthday: z.date().optional().nullable(),
  notes: z.string().optional(),
  project_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
  address: z.string().optional(),
  custom_properties: z.record(z.any()).optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

const PersonFormDialog = ({ open, onOpenChange, person }: PersonFormDialogProps) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [customProperties, setCustomProperties] = useState<ContactProperty[]>([]);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      full_name: '', email: '', phone: '', company: '', job_title: '',
      department: '', linkedin: '', twitter: '', instagram: '', birthday: null,
      notes: '', project_ids: [], tag_ids: [], address: '', custom_properties: {},
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: projectsData } = await supabase.from('projects').select('id, name');
      if (projectsData) setAllProjects(projectsData as any);

      const { data: tagsData } = await supabase.from('tags').select('id, name, color');
      if (tagsData) setAllTags(tagsData);

      const { data: customPropsData } = await supabase.from('contact_properties').select('*').eq('is_default', false);
      if (customPropsData) setCustomProperties(customPropsData);
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (person) {
      form.reset({
        full_name: person.full_name,
        email: person.email || person.contact?.emails?.[0] || '',
        phone: person.phone || person.contact?.phones?.[0] || '',
        company: person.company || '',
        job_title: person.job_title || '',
        department: person.department || '',
        linkedin: person.social_media?.linkedin || '',
        twitter: person.social_media?.twitter || '',
        instagram: person.social_media?.instagram || '',
        birthday: person.birthday ? new Date(person.birthday) : null,
        notes: person.notes || '',
        project_ids: person.projects?.map(p => p.id) || [],
        tag_ids: person.tags?.map(t => t.id) || [],
        address: person.address?.formatted_address || '',
        custom_properties: person.custom_properties || {},
      });
    } else {
      form.reset({
        full_name: '', email: '', phone: '', company: '', job_title: '',
        department: '', linkedin: '', twitter: '', instagram: '', birthday: null,
        notes: '', project_ids: [], tag_ids: [], address: '', custom_properties: {},
      });
    }
  }, [person, form, open]);

  const onSubmit = async (values: PersonFormValues) => {
    setIsSaving(true);
    const { custom_properties, ...standardValues } = values;
    const { error } = await supabase.rpc('upsert_person_with_details', {
      p_id: person?.id || null,
      p_full_name: values.full_name,
      p_contact: { 
        emails: values.email ? [values.email] : [],
        phones: values.phone ? [values.phone] : []
      },
      p_company: values.company,
      p_job_title: values.job_title,
      p_department: values.department,
      p_social_media: { linkedin: values.linkedin, twitter: values.twitter, instagram: values.instagram },
      p_birthday: values.birthday ? format(values.birthday, 'yyyy-MM-dd') : null,
      p_notes: values.notes,
      p_project_ids: values.project_ids,
      p_existing_tag_ids: values.tag_ids,
      p_custom_tags: [],
      p_avatar_url: person?.avatar_url,
      p_address: values.address ? { formatted_address: values.address } : null,
      p_custom_properties: custom_properties,
    });
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      toast.success(`Successfully saved ${values.full_name}.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person', person?.id] });
      onOpenChange(false);
    }
  };

  const isUser = !!person?.user_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input {...field} disabled={isUser} /></FormControl>
                {isUser && <p className="text-xs text-muted-foreground">Nama dikelola oleh profil pengguna.</p>}
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} disabled={isUser} /></FormControl>
                  {isUser && <p className="text-xs text-muted-foreground">Email dikelola oleh profil pengguna.</p>}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <PhoneNumberInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter address"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="job_title" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="linkedin" render={({ field }) => (
                <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="twitter" render={({ field }) => (
                <FormItem><FormLabel>Twitter URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="instagram" render={({ field }) => (
              <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tag_ids" render={({ field }) => (
              <FormItem><FormLabel>Tags</FormLabel>
                <MultiSelect
                  options={allTags.map(t => ({ value: t.id, label: t.name }))}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select tags..."
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="project_ids" render={({ field }) => (
              <FormItem><FormLabel>Related Projects</FormLabel>
                <MultiSelect
                  options={allProjects.map(p => ({ value: p.id, label: p.name }))}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select projects..."
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="birthday" render={({ field }) => (
              <FormItem>
                <FormLabel>Birthday</FormLabel>
                <FormControl>
                  <AntDatePicker 
                    value={field.value} 
                    onChange={field.onChange} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            {customProperties.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
                {customProperties.map(prop => (
                  <FormField
                    key={prop.id}
                    control={form.control}
                    name={`custom_properties.${prop.name}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{prop.label}</FormLabel>
                        <FormControl>
                          <Input type={prop.type} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PersonFormDialog;