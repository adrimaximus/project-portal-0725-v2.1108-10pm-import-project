import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import RoleManagerDialog, { Role } from '@/components/settings/RoleManagerDialog';
import TeamMembersCard from '@/components/settings/TeamMembersCard';
import InviteMemberDialog from '@/components/settings/InviteMemberDialog';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const TeamSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { members, isLoading: isLoadingMembers } = useTeamMembers();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      return data as Role[];
    },
  });

  const handleEditRole = (role: Role) => {
    setRoleToEdit(role);
    setIsRoleManagerOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    if (memberToDelete.status === 'Pending invite') {
      // It's an invitation
      const { error } = await supabase.from('invitations').delete().eq('recipient_email', memberToDelete.email);
      if (error) {
        toast.error(`Failed to cancel invite: ${error.message}`);
      } else {
        toast.success(`Invitation for ${memberToDelete.email} cancelled.`);
        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      }
    } else {
      // It's a profile
      // This should be a soft delete or a more complex operation, for now, we just show a message
      toast.info("Delete functionality for active members is not fully implemented.");
    }
    setMemberToDelete(null);
  };

  const isLoading = isLoadingMembers || isLoadingRoles;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Team Management</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members, roles, and permissions.</p>
        </div>

        {isLoading ? (
          <p>Loading team data...</p>
        ) : (
          <TeamMembersCard
            members={members}
            roles={roles}
            onInvite={() => setIsInviteOpen(true)}
            onEditRole={handleEditRole}
            onDeleteMember={setMemberToDelete}
          />
        )}

        <InviteMemberDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          roles={roles}
        />

        <RoleManagerDialog
          open={isRoleManagerOpen}
          onOpenChange={setIsRoleManagerOpen}
          roles={roles}
          roleToEdit={roleToEdit}
          setRoleToEdit={setRoleToEdit}
        />

        <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToDelete?.status === 'Pending invite'
                  ? `This will cancel the invitation for ${memberToDelete.email}. They will not be able to join the team with the current link.`
                  : `This will permanently remove ${memberToDelete?.name} from the team. This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
                {memberToDelete?.status === 'Pending invite' ? 'Cancel Invite' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PortalLayout>
  );
};

export default TeamSettingsPage;