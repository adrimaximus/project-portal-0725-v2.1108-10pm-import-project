import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person } from '@/types';
import { format } from 'date-fns';

export const usePeopleMutations = () => {
  const queryClient = useQueryClient();

  const upsertPersonMutation = useMutation({
    mutationFn: async (values: any) => {
      const { person, ...formValues } = values;
      const { error } = await supabase.rpc('upsert_person_with_details', {
        p_id: person?.id || null,
        p_full_name: formValues.full_name,
        p_contact: { 
          emails: formValues.email ? [formValues.email] : [],
          phones: formValues.phone ? [formValues.phone] : []
        },
        p_company: formValues.company,
        p_job_title: formValues.job_title,
        p_department: formValues.department,
        p_social_media: { linkedin: formValues.linkedin, twitter: formValues.twitter, instagram: formValues.instagram },
        p_birthday: formValues.birthday ? format(formValues.birthday, 'yyyy-MM-dd') : null,
        p_notes: formValues.notes,
        p_project_ids: formValues.project_ids,
        p_existing_tag_ids: formValues.tag_ids,
        p_custom_tags: [],
        p_avatar_url: person?.avatar_url,
        p_address: formValues.address || null,
      });
      if (error) throw error;
      return formValues.full_name;
    },
    onSuccess: (full_name) => {
      toast.success(`Successfully saved ${full_name}.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (person: Person) => {
      const { error } = await supabase.from('people').delete().eq('id', person.id);
      if (error) throw error;
      return person;
    },
    onSuccess: (person) => {
      toast.success(`${person.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error: any, person) => {
      toast.error(`Failed to delete ${person.full_name}: ${error.message}`);
    }
  });

  const findDuplicatesMutation = useMutation({
    mutationFn: async () => {
      toast.info("Searching for duplicates...");
      const { data: pairs, error: rpcError } = await supabase.rpc('find_duplicate_people');
      if (rpcError) throw new Error(rpcError.message);
      if (!pairs || pairs.length === 0) {
        toast.info("No potential duplicates found.");
        return null;
      }
      toast.info(`Found ${pairs.length} potential duplicate(s). Asking AI for analysis...`);
      const { data: aiData, error: aiError } = await supabase.functions.invoke('openai-generator', {
        body: { feature: 'analyze-duplicates', payload: { duplicates: pairs } },
      });
      if (aiError) throw new Error(aiError.message);
      return { summary: aiData.result, pairs };
    },
    onError: (error: any) => {
      toast.error("Failed to check for duplicates.", { description: error.message });
    }
  });

  const mergeDuplicatesMutation = useMutation({
    mutationFn: async ({ primary, secondary }: { primary: Person, secondary: Person }) => {
      const { error } = await supabase.functions.invoke('openai-generator', {
        body: {
          feature: 'ai-merge-contacts',
          payload: {
            primary_person_id: primary.id,
            secondary_person_id: secondary.id,
          }
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contacts merged successfully!");
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error: any) => {
      toast.error("Failed to merge contacts.", { description: error.message });
    }
  });

  return {
    upsertPerson: upsertPersonMutation.mutateAsync,
    isUpserting: upsertPersonMutation.isPending,
    deletePerson: deletePersonMutation.mutate,
    findDuplicates: findDuplicatesMutation.mutateAsync,
    isFindingDuplicates: findDuplicatesMutation.isPending,
    mergeDuplicates: mergeDuplicatesMutation.mutateAsync,
    isMerging: mergeDuplicatesMutation.isPending,
  };
};