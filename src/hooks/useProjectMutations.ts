import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, User } from '@/types';
import { useNavigate } from 'react-router-dom';

export const useProjectMutations = (projectId?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateProject = useMutation({
    mutationFn: async (editedProject: Partial<Project> & { id: string }) => {
      const { id, name, description, category, status, budget, start_date, due_date, payment_status, payment_due_date, services, assignedTo, venue, tags, person_ids } = editedProject;
      
      const memberIds = assignedTo?.map(m => m.id);
      const serviceTitles = services;
      const existingTagIds = tags?.filter(t => !t.isNew).map(t => t.id);
      const customTags = tags?.filter(t => t.isNew).map(({ name, color }) => ({ name, color }));

      const { data, error } = await supabase.rpc('update_project_details', {
        p_project_id: id,
        p_name: name,
        p_description: description,
        p_category: category,
        p_status: status,
        p_budget: budget,
        p_start_date: start_date,
        p_due_date: due_date,
        p_payment_status: payment_status,
        p_payment_due_date: payment_due_date,
        p_venue: venue,
        p_member_ids: memberIds,
        p_service_titles: serviceTitles,
        p_existing_tags: existingTagIds,
        p_custom_tags: customTags,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Project "${variables.name}" updated.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', data[0].slug] });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });

  const createComment = useMutation({
    mutationFn: async (comment: { project_id: string, author_id: string, text: string }) => {
      const { data, error } = await supabase.from('comments').insert(comment).select().single();
      if (error) throw error;
      return data;
    },
  });

  return { updateProject, createComment };
};