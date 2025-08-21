import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Person } from '@/pages/PeoplePage';

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
  birthday: z.date().optional(),
  notes: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

const PersonFormDialog = ({ open, onOpenChange, person }: PersonFormDialogProps) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      department: '',
      linkedin: '',
      twitter: '',
      birthday: undefined,
      notes: '',
    }
  });

  useEffect(() => {
    if (person) {
      form.reset({
        full_name: person.full_name,
        email: person.contact?.email || '',
        phone: person.contact?.phone || '',
        company: person.company || '',
        job_title: person.job_title || '',
        department: person.department || '',
        linkedin: person.social_media?.linkedin || '',
        twitter: person.social_media?.twitter || '',
        birthday: person.birthday ? new Date(person.birthday) : undefined,
        notes: person.notes || '',
      });
    } else {
      form.reset();
    }
  }, [person, form]);

  const onSubmit = async (values: PersonFormValues) => {
    setIsSaving(true);
    const dataToUpsert = {
      full_name: values.full_name,
      company: values.company,
      job_title: values.job_title,
      department: values.department,
      birthday: values.birthday ? format(values.birthday, 'yyyy-MM-dd') : null,
      notes: values.notes,
      contact: {
        email: values.email,
        phone: values.phone,
      },
      social_media: {
        linkedin: values.linkedin,
        twitter: values.twitter,
      },
      updated_at: new Date().toISOString(),
    };

    const promise = person
      ? supabase.from('people').update(dataToUpsert).eq('id', person.id)
      : supabase.from('people').insert(dataToUpsert);

    const { error } = await promise;
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
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="job_title" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="linkedin" render={({ field }) => (
                <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="twitter" render={({ field }) => (
                <FormItem><FormLabel>Twitter URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="birthday" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Birthday</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="pt-4">
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