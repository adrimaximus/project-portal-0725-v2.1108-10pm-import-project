import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';
import { Role } from '@/components/settings/RoleManagerDialog';

export const useTeamSettingsMutations = () => {
  const queryClient = useQueryClient();

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string, newRole: string }) => {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: (_, { newRole }) => {
      toast.success(`Member role updated to ${newRole}.`);
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const upsertRole = useMutation({
    mutationFn: async (role: Omit<Role, 'id'> & { id?: string }) => {
      const { error } = await supabase.from('roles').upsert(role);
      if (error) throw error;
    },
    onSuccess: (_, role) => {
      toast.success(role.id ? 'Role updated.' : 'Role created.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to save role: ${error.message}`);
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role deleted.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });

  const toggleSuspendMember = useMutation({
    mutationFn: async (member: User) => {
      if (member.status === 'Pending invite') return;
      const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', member.id);
      if (error) throw error;
      return { memberName: member.name, newStatus };
    },
    onSuccess: (data) => {
      if (!data) return;
      toast.success(`${data.memberName} has been ${data.newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update member status: ${error.message}`);
    },
  });

  return { updateMemberRole, upsertRole, deleteRole, toggleSuspendMember };
};