import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import RoleManagerDialog, { Role } from '@/components/settings/RoleManagerDialog';
import AddUserDialog from '@/components/settings/AddUserDialog';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useRoles } from '@/hooks/useRoles';
import { useFeatures } from '@/contexts/FeaturesContext';
import RolesCard from '@/components/settings/RolesCard';
import InviteCard, { Invite } from '@/components/settings/InviteCard';
import TeamMembersCard from '@/components/settings/TeamMembersCard';

const TeamSettingsPage = () => {
  const { user: currentUser } = useAuth();
  const { data: members = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useTeamMembers();
  const { data: roles = [], isLoading: isLoadingRoles, refetch: refetchRoles } = useRoles();
  const { features: workspaceFeatures } = useFeatures();
  
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const isMasterAdmin = currentUser?.role === 'master admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;

  const fetchData = () => {
    refetchMembers();
    refetchRoles();
  };

  const validRoles = useMemo(() => roles.filter(r => r.name && r.name.trim() !== ''), [roles]);

  const handleSendInvites = async (invites: Invite[]) => {
    const validInvites = invites.filter(invite => invite.email.trim() !== '');
    if (validInvites.length === 0) {
      toast.error("Please enter at least one email address.");
      return;
    }

    let successCount = 0;
    toast.info(`Sending ${validInvites.length} invite(s)...`);

    for (const invite of validInvites) {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: invite.email, role: invite.role },
      });

      if (error) {
        toast.error(`Failed to send invite to ${invite.email}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} invite(s) sent successfully!`);
      fetchData();
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (error) {
      toast.error(`Failed to update role: ${error.message}`);
    } else {
      toast.success("Role updated successfully.");
      fetchData();
    }
  };

  const handleToggleSuspend = async (member: User) => {
    if (member.status === 'Pending invite') return;
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', member.id);
    if (error) {
      toast.error(`Failed to ${newStatus === 'active' ? 'unsuspend' : 'suspend'} member: ${error.message}`);
    } else {
      toast.success(`Member has been ${newStatus}.`);
      fetchData();
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: memberToDelete.id },
    });
    if (error) {
      toast.error(`Failed to delete member: ${error.message}`);
    } else {
      toast.success(`Member ${memberToDelete.name} has been deleted.`);
      fetchData();
    }
    setMemberToDelete(null);
  };

  const handleSaveRole = async (role: Role) => {
    const { id, ...roleData } = role;
    const promise = id
      ? supabase.from('roles').update(roleData).eq('id', id)
      : supabase.from('roles').insert(roleData);

    const { error } = await promise;
    if (error) {
      toast.error(`Failed to save role: ${error.message}`);
    } else {
      toast.success(`Role "${role.name}" saved successfully.`);
      fetchData();
      setIsRoleDialogOpen(false);
      setEditingRole(null);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const { error } = await supabase.from('roles').delete().eq('id', roleToDelete.id!);
    if (error) {
      toast.error(`Failed to delete role: ${error.message}`);
    } else {
      toast.success(`Role "${roleToDelete.name}" has been deleted.`);
      fetchData();
    }
    setRoleToDelete(null);
  };

  const handleResendInvite = async (member: User) => {
    if (!member.email || !member.role) {
      toast.error("Cannot resend invite: email or role is missing.");
      return;
    }

    const { error: deleteError } = await supabase.functions.invoke('delete-user', {
      body: { user_id: member.id },
    });

    if (deleteError) {
      toast.error(`Failed to remove previous invite for ${member.email}: ${deleteError.message}`);
      return;
    }

    const { error: inviteError } = await supabase.functions.invoke('invite-user', {
      body: { email: member.email, role: member.role },
    });

    if (inviteError) {
      toast.error(`Failed to resend invite to ${member.email}: ${inviteError.message}`);
    } else {
      toast.success(`Invite resent to ${member.email}.`);
      fetchData();
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Team Members & Access</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members & Access</h1>
          <p className="text-muted-foreground">Manage your team members and their roles across the application.</p>
        </div>

        <RolesCard
          roles={roles}
          onCreateRole={handleCreateRole}
          onEditRole={handleEditRole}
          onDeleteRole={setRoleToDelete}
        />

        {isAdmin && (
          <InviteCard
            roles={validRoles}
            onSendInvites={handleSendInvites}
            onAddManually={() => setIsAddUserDialogOpen(true)}
            isMasterAdmin={isMasterAdmin}
          />
        )}

        <TeamMembersCard
          members={members}
          roles={validRoles}
          currentUser={currentUser}
          isLoading={isLoadingMembers || isLoadingRoles}
          onRoleChange={handleRoleChange}
          onToggleSuspend={handleToggleSuspend}
          onDeleteMember={setMemberToDelete}
          onResendInvite={handleResendInvite}
        />
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToDelete?.status === 'Pending invite'
                  ? `This will cancel the invitation for ${memberToDelete?.email}. They will not be able to join the team with the current link.`
                  : `This will permanently delete ${memberToDelete?.name} from the team. This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMember}>
                {memberToDelete?.status === 'Pending invite' ? 'Cancel Invite' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the "{roleToDelete?.name}" role. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteRole}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <RoleManagerDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen} onSave={handleSaveRole} role={editingRole} workspaceFeatures={workspaceFeatures} />
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={fetchData}
        roles={validRoles.filter(r => isMasterAdmin || r.name !== 'master admin')}
      />
    </PortalLayout>
  );
};

export default TeamSettingsPage;