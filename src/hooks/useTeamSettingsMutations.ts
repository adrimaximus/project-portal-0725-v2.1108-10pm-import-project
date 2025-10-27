import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';
import { Role } from '@/components/settings/RoleManagerDialog';
import { Invite } from '@/components/settings/InviteCard';
import { getErrorMessage } from '@/lib/utils';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTeamSettingsMutations = (fetchData: () => void) => {
  const { mutate: sendInvites, isPending: isSendingInvites } = useMutation({
    mutationFn: async (invites: Invite[]) => {
      const validInvites = invites.filter(invite => invite.email.trim() !== '');
      if (validInvites.length === 0) {
        throw new Error("Please enter at least one email address.");
      }

      let successCount = 0;
      toast.info(`Sending ${validInvites.length} invite(s)...`);

      for (const invite of validInvites) {
        const { data, error } = await supabase.functions.invoke('create-user-manually', {
          body: { 
            email: invite.email, 
            mode: 'invite',
            app_metadata: { role: invite.role }
          },
        });

        if (error) {
          let errorMessage = getErrorMessage(error);
          if (error.context && typeof error.context.json === 'function') {
            try {
              const errorBody = await error.context.json();
              if (errorBody.error) {
                errorMessage = errorBody.error;
              }
            } catch (e) {
              // Fallback to default error message
            }
          }
          toast.error(`Failed to send invite to ${invite.email}`, { description: errorMessage });
        } else {
          if (data.message) {
            toast.info(data.message);
          }
          successCount++;
        }
        if (validInvites.length > 1) {
            await wait(500);
        }
      }
      return successCount;
    },
    onSuccess: (successCount) => {
      if (successCount > 0) {
        toast.success(`${successCount} invite(s) processed successfully!`);
        fetchData();
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    }
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string, newRole: string }) => {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully.");
      fetchData();
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${getErrorMessage(error)}`);
    }
  });

  const { mutate: toggleSuspend } = useMutation({
    mutationFn: async (member: User) => {
      if (member.status === 'Pending invite') return;
      const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', member.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(`Member has been ${newStatus}.`);
      fetchData();
    },
    onError: (error: any) => {
      toast.error(`Failed to update member status: ${getErrorMessage(error)}`);
    }
  });

  const { mutate: deleteMember } = useMutation({
    mutationFn: async (member: User) => {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: member.id },
      });
      if (error) throw error;
      return member;
    },
    onSuccess: (member) => {
      toast.success(`Member ${member.name} has been deleted.`);
      fetchData();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete member: ${getErrorMessage(error)}`);
    }
  });

  const { mutate: saveRole, isPending: isSavingRole } = useMutation({
    mutationFn: async (role: Role) => {
      const { id, ...roleData } = role;
      const promise = id
        ? supabase.from('roles').update(roleData).eq('id', id)
        : supabase.from('roles').insert(roleData);
      const { error } = await promise;
      if (error) throw error;
      return role;
    },
    onSuccess: (role) => {
      toast.success(`Role "${role.name}" saved successfully.`);
      fetchData();
    },
    onError: (error: any) => {
      toast.error(`Failed to save role: ${getErrorMessage(error)}`);
    }
  });

  const { mutate: deleteRole } = useMutation({
    mutationFn: async (role: Role) => {
      const { error } = await supabase.from('roles').delete().eq('id', role.id!);
      if (error) throw error;
      return role;
    },
    onSuccess: (role) => {
      toast.success(`Role "${role.name}" has been deleted.`);
      fetchData();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete role: ${getErrorMessage(error)}`);
    }
  });

  const { mutate: resendInvite } = useMutation({
    mutationFn: async (member: User) => {
      if (!member.email || !member.role) {
        throw new Error("Cannot resend invite: email or role is missing.");
      }
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { user_id: member.id },
      });
      if (deleteError) throw new Error(`Failed to remove previous invite for ${member.email}: ${deleteError.message}`);
      const { error: inviteError } = await supabase.functions.invoke('create-user-manually', {
        body: { 
          email: member.email, 
          mode: 'invite',
          app_metadata: { role: member.role }
        },
      });
      if (inviteError) throw new Error(`Failed to resend invite to ${member.email}: ${inviteError.message}`);
      return member;
    },
    onSuccess: (member) => {
      toast.success(`Invite resent to ${member.email}.`);
      fetchData();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    }
  });

  return {
    sendInvites,
    isSendingInvites,
    changeRole,
    toggleSuspend,
    deleteMember,
    saveRole,
    isSavingRole,
    deleteRole,
    resendInvite,
  };
};