import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, UserProfile } from '@/types';
import { useNavigate } from 'react-router-dom';

export const useProjectMutations = (projectSlug?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const upsertProjectMutation = useMutation({
    mutationFn: async (editedProject: Partial<Project> & { id?: string }) => {
      const { id, name, description, category, status, budget, start_date, due_date, payment_status, payment_due_date, services, assignedTo, venue, tags, person_ids } = editedProject;
      
      const memberIds = assignedTo?.map(u => u.id) || [];
      
      const { data, error } = await supabase
        .rpc('update_project_details', {
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
          p_venue: venue || null,
          p_member_ids: memberIds,
          p_service_titles: services || [],
          p_existing_tags: (tags || []).filter(t => !t.isNew).map(t => t.id),
          p_custom_tags: (tags || []).filter(t => t.isNew).map(({ name, color }) => ({ name, color })),
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Project details saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['project', projectSlug] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (data && data.slug !== projectSlug) {
        navigate(`/projects/${data.slug}`, { replace: true });
      }
    },
    onError: (error) => {
      toast.error('Failed to save project details.', { description: error.message });
    },
  });

  return { upsertProjectMutation };
};