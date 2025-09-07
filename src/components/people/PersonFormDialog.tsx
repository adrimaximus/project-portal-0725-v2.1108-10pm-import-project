"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Person } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TagsMultiselect } from "@/components/ui/TagsMultiselect";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";

const personFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  tags: z.array(z.custom<Tag>()).optional(),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

interface PersonFormDialogProps {
  person?: Person;
  onSuccess?: () => void;
}

export function PersonFormDialog({ person, onSuccess }: PersonFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const { toast } = useToast();
  const isEditMode = !!person;

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      full_name: person?.full_name || "",
      email: person?.contact?.emails?.[0] || "",
      tags: person?.tags || [],
    },
  });

  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase.from("tags").select("*");
      if (error) {
        console.error("Error fetching tags:", error);
        toast({
          title: "Error",
          description: "Could not fetch tags.",
          variant: "destructive",
        });
      } else {
        setAllTags(data || []);
      }
    }
    fetchTags();
  }, [toast]);
  
  useEffect(() => {
    if (person) {
      form.reset({
        full_name: person.full_name || "",
        email: person.contact?.emails?.[0] || "",
        tags: person.tags || [],
      });
    }
  }, [person, form]);

  const handleCreateTag = async (name: string): Promise<Tag | undefined> => {
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const { data, error } = await supabase.rpc('create_tag', { p_name: name, p_color: randomColor });

    if (error || !data) {
      toast({
        title: "Error creating tag",
        description: error?.message || "An unknown error occurred.",
        variant: "destructive",
      });
      return undefined;
    }
    
    const newTag = data as Tag;
    setAllTags((prev) => [...prev, newTag]);
    toast({ title: "Tag created", description: `Tag "${name}" has been created.` });
    return newTag;
  };

  async function onSubmit(values: PersonFormValues) {
    const { error } = await supabase.rpc("upsert_person_with_details", {
      p_id: person?.id || null,
      p_full_name: values.full_name,
      p_contact: { emails: values.email ? [values.email] : [] },
      p_company: person?.company || null,
      p_job_title: person?.job_title || null,
      p_department: null,
      p_social_media: null,
      p_birthday: null,
      p_notes: null,
      p_project_ids: [],
      p_existing_tag_ids: values.tags?.map((t) => t.id) || [],
      p_custom_tags: null,
      p_avatar_url: null,
      p_address: null,
      p_custom_properties: null,
    });

    if (error) {
      toast({
        title: "Error saving person",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Person "${values.full_name}" has been saved.`,
      });
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Person" : "Create Person"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for this person." : "Add a new person to your contacts."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsMultiselect
                      value={field.value || []}
                      onChange={field.onChange}
                      options={allTags}
                      onTagCreate={handleCreateTag}
                      placeholder="Select or create tags..."
                      allowCreate
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Person"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}