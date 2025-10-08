import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';
import { Person, Project, Tag } from '@/types';
import { MultiSelect } from '../ui/multi-select';
import { TagInput } from '../ui/TagInput';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { generatePastelColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, User as UserIcon } from 'lucide-react';
import AddressAutocompleteInput from '../AddressAutocompleteInput';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  contact: z.object({
    emails: z.array(z.string().email('Invalid email').or(z.literal(''))).optional(),
    phones: z.array(z.string().regex(phoneRegex, 'Invalid phone number').or(z.literal(''))).optional(),
    websites: z.array(z.string().url('Invalid URL').or(z.literal(''))).optional(),
  }),
  company: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  social_media: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
  project_ids: z.array(z.string()).optional(),
  existing_tag_ids: z.array(z.string()).optional(),
  custom_tags: z.array(z.object({ name: z.string(), color: z.string() })).optional(),
  avatar_url: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

interface PersonFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null;
}

export default function PersonFormDialog({ isOpen, onClose, person }: PersonFormDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(person?.avatar_url || null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('id, name, color');
      if (error) throw error;
      return data;
    },
  });

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      contact: { emails: [''], phones: [''], websites: [''] },
      company: '',
      job_title: '',
      department: '',
      social_media: { linkedin: '', twitter: '', instagram: '' },
      birthday: '',
      notes: '',
      project_ids: [],
      existing_tag_ids: [],
      custom_tags: [],
      avatar_url: '',
      address: { street: '', city: '', state: '', zip: '', country: '' },
    },
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control, name: "contact.emails" });
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control, name: "contact.phones" });
  const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({ control, name: "contact.websites" });

  useEffect(() => {
    if (person) {
      reset({
        full_name: person.full_name,
        contact: {
          emails: person.contact?.emails || [''],
          phones: person.contact?.phones || [''],
          websites: person.contact?.websites || [''],
        },
        company: person.company,
        job_title: person.job_title,
        department: person.department,
        social_media: person.social_media,
        birthday: person.birthday ? person.birthday.split('T')[0] : '',
        notes: person.notes,
        project_ids: person.projects?.map(p => p.id) || [],
        existing_tag_ids: person.tags?.map(t => t.id) || [],
        avatar_url: person.avatar_url,
        address: person.address,
      });
      setAvatarPreview(person.avatar_url || null);
    } else {
      reset();
      setAvatarPreview(null);
    }
  }, [person, reset]);

  const upsertPersonMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let avatarUrl = person?.avatar_url || '';

      if (avatarFile) {
        const filePath = `${user!.id}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase.rpc('upsert_person_with_details', {
        p_id: person?.id,
        p_full_name: formData.full_name,
        p_contact: {
          emails: formData.contact?.emails?.filter(e => e),
          phones: formData.contact?.phones?.filter(p => p),
          websites: formData.contact?.websites?.filter(w => w),
        },
        p_company: formData.company,
        p_job_title: formData.job_title,
        p_department: formData.department,
        p_social_media: formData.social_media,
        p_birthday: formData.birthday || null,
        p_notes: formData.notes,
        p_project_ids: formData.project_ids,
        p_existing_tag_ids: formData.existing_tag_ids,
        p_custom_tags: formData.custom_tags,
        p_avatar_url: avatarUrl,
        p_address: formData.address,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Person ${person ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      if (person) {
        queryClient.invalidateQueries({ queryKey: ['person', person.id] });
      }
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data: FormData) => {
    upsertPersonMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
          <DialogDescription>
            {person ? 'Update the details of this person.' : 'Add a new person to your contacts.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(person?.id || '') }}>
                  <UserIcon className="h-8 w-8 text-white" />
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                <Camera className="h-4 w-4" />
              </Label>
              <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" {...register('job_title')} />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register('company')} />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} />
            </div>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="contact">
              <TabsList>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="relations">Relations</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="contact" className="space-y-4 pt-4">
                {/* Contact fields */}
              </TabsContent>
              <TabsContent value="details" className="space-y-4 pt-4">
                {/* Details fields */}
              </TabsContent>
              <TabsContent value="relations" className="space-y-4 pt-4">
                {/* Relations fields */}
              </TabsContent>
              <TabsContent value="notes" className="pt-4">
                <Textarea {...register('notes')} placeholder="Add any relevant notes here..." rows={10} />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="md:col-span-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={upsertPersonMutation.isPending}>
              {upsertPersonMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}