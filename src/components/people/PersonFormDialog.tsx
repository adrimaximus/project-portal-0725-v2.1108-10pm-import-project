import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Camera, User as UserIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Person } from '@/pages/PeoplePage';
import { Project, Tag, User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DynamicInputList from './DynamicInputList';
import { TagInput } from '../goals/TagInput';
import { colors } from '@/data/colors';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
}

const personSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  emails: z.array(z.object({ value: z.string().email("Invalid email address").or(z.literal('')) })).optional(),
  phones: z.array(z.object({ value: z.string() })).optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  birthday: z.date().optional().nullable(),
  notes: z.string().optional(),
  project_ids: z.array(z.string()).optional(),
  tags: z.array(z.any()).optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

const PersonFormDialog = ({ open, onOpenChange, person }: PersonFormDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      full_name: '', emails: [{ value: '' }], phones: [{ value: '' }], company: '', job_title: '',
      department: '', linkedin: '', twitter: '', instagram: '', birthday: null,
      notes: '', project_ids: [], tags: [],
    }
  });

  const fetchDropdownData = useCallback(async () => {
    if (!user) return;
    const { data: projectsData } = await supabase.from('projects').select('id, name');
    if (projectsData) setAllProjects(projectsData as any);

    const { data: tagsData } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},user_id.is.null`);
    if (tagsData) setAllTags(tagsData);
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open, fetchDropdownData]);

  useEffect(() => {
    if (person) {
      form.reset({
        full_name: person.full_name,
        emails: person.contact?.emails?.map(e => ({ value: e })) || [{ value: '' }],
        phones: person.contact?.phones?.map(p => ({ value: p })) || [{ value: '' }],
        company: person.company || '',
        job_title: person.job_title || '',
        department: person.department || '',
        linkedin: person.social_media?.linkedin || '',
        twitter: person.social_media?.twitter || '',
        instagram: person.social_media?.instagram || '',
        birthday: person.birthday ? new Date(person.birthday) : null,
        notes: person.notes || '',
        project_ids: person.projects?.map(p => p.id) || [],
        tags: person.tags || [],
      });
      setAvatarPreview(person.avatar_url || null);
      setAvatarFile(null);
    } else {
      form.reset({
        full_name: '', emails: [{ value: '' }], phones: [{ value: '' }], company: '', job_title: '',
        department: '', linkedin: '', twitter: '', instagram: '', birthday: null,
        notes: '', project_ids: [], tags: [],
      });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [person, form, open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleTagCreate = (tagName: string): Tag => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const onSubmit = async (values: PersonFormValues) => {
    setIsSaving(true);
    let avatar_url = person?.avatar_url || null;

    if (avatarFile) {
      const filePath = `people-avatars/${person?.id || uuidv4()}/${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
      if (uploadError) {
        toast.error("Failed to upload avatar.");
        setIsSaving(false);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatar_url = data.publicUrl;
    }

    const { error } = await supabase.rpc('upsert_person_with_details', {
      p_id: person?.id || null,
      p_full_name: values.full_name,
      p_contact: {
        emails: values.emails?.map(e => e.value).filter(Boolean),
        phones: values.phones?.map(p => p.value).filter(Boolean),
      },
      p_company: values.company,
      p_job_title: values.job_title,
      p_department: values.department,
      p_social_media: { linkedin: values.linkedin, twitter: values.twitter, instagram: values.instagram },
      p_birthday: values.birthday ? format(values.birthday, 'yyyy-MM-dd') : null,
      p_notes: values.notes,
      p_project_ids: values.project_ids,
      p_existing_tag_ids: (values.tags || []).filter(t => !t.isNew).map(t => t.id),
      p_custom_tags: (values.tags || []).filter(t => t.isNew).map(({ name, color }) => ({ name, color })),
      p_avatar_url: avatar_url,
    });
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      toast.success(`Successfully saved ${values.full_name}.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
            </div>
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={!!person?.user_id} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="emails" render={() => (
                <FormItem><FormLabel>Email</FormLabel><DynamicInputList control={form.control} name="emails" placeholder="name@example.com" inputType="email" disabled={!!person?.user_id} /><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phones" render={() => (
                <FormItem><FormLabel>Phone</FormLabel><DynamicInputList control={form.control} name="phones" placeholder="e.g., +62 812..." inputType="tel" /><FormMessage /></FormItem>
              )} />
            </div>
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
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem><FormLabel>Tags</FormLabel>
                <TagInput
                  allTags={allTags}
                  selectedTags={field.value || []}
                  onTagsChange={field.onChange}
                  onTagCreate={handleTagCreate}
                  user={user}
                  onTagsUpdated={fetchDropdownData}
                />
                <FormMessage />
              </FormItem>
            )} />
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