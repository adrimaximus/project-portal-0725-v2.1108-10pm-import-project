import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import RoleManagerDialog, { Role } from '@/components/settings/RoleManagerDialog';
import AddUserDialog from '@/components/settings/AddUserDialog';
import { useFeatures } from '@/contexts/FeaturesContext';
import RolesCard from '@/components/settings/RolesCard';
import InviteCard, { Invite } from '@/components/settings/InviteCard';
import TeamMembersCard from '@/components/settings/TeamMembersCard';
import { useTeamSettingsData } from '@/hooks/useTeamSettingsData';
import { useTeamSettingsMutations } from '@/hooks/useTeamSettingsMutations';
import ConfirmationDialog from '@/components/settings/ConfirmationDialog';

type DialogState = 
  | { type: 'deleteMember', data: User }
  | { type: 'deleteRole', data: Role }
  | { type: 'editRole', data: Role }
  | { type: 'createRole' }
  | { type: 'addUser' }
  | { type: null };

const TeamSettingsPage = () => {
  const { user: currentUser } = useAuth();
  const { features: workspaceFeatures } = useFeatures();
  
  const { members, roles, validRoles, isLoading, fetchData } = useTeamSettingsData();
  const { 
    sendInvites, 
    changeRole, 
    toggleSuspend, 
    deleteMember, 
    saveRole, 
    isSavingRole,
    deleteRole, 
    resendInvite 
  } = useTeamSettingsMutations(fetchData);

  const [dialogState, setDialogState] = useState<DialogState>({ type: null });

  const isMasterAdmin = currentUser?.role === 'master admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;

  const handleSaveRole = (role: Role) => {
    saveRole(role, {
      onSuccess: () => setDialogState({ type: null }),
    });
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
          onCreateRole={() => setDialogState({ type: 'createRole' })}
          onEditRole={(role) => setDialogState({ type: 'editRole', data: role })}
          onDeleteRole={(role) => setDialogState({ type: 'deleteRole', data: role })}
        />

        {isAdmin && (
          <InviteCard
            roles={validRoles}
            onSendInvites={(invites) => sendInvites(invites)}
            onAddManually={() => setDialogState({ type: 'addUser' })}
            isMasterAdmin={isMasterAdmin}
          />
        )}

        <TeamMembersCard
          members={members}
          roles={validRoles}
          currentUser={currentUser}
          isLoading={isLoading}
          onRoleChange={(memberId, newRole) => changeRole({ memberId, newRole })}
          onToggleSuspend={toggleSuspend}
          onDeleteMember={(member) => setDialogState({ type: 'deleteMember', data: member })}
          onResendInvite={resendInvite}
        />
      </div>

      {dialogState.type === 'deleteMember' && (
        <ConfirmationDialog
          open={true}
          onOpenChange={() => setDialogState({ type: null })}
          onConfirm={() => deleteMember(dialogState.data)}
          title="Are you sure?"
          description={
            dialogState.data?.status === 'Pending invite'
              ? `This will cancel the invitation for ${dialogState.data?.email}. They will not be able to join the team with the current link.`
              : `This will permanently delete ${dialogState.data?.name} from the team. This action cannot be undone.`
          }
          confirmText={dialogState.data?.status === 'Pending invite' ? 'Cancel Invite' : 'Delete'}
        />
      )}

      {dialogState.type === 'deleteRole' && (
        <ConfirmationDialog
          open={true}
          onOpenChange={() => setDialogState({ type: null })}
          onConfirm={() => deleteRole(dialogState.data)}
          title="Are you sure?"
          description={`This will permanently delete the "${dialogState.data?.name}" role. This action cannot be undone.`}
          confirmText="Delete"
        />
      )}

      <RoleManagerDialog
        open={dialogState.type === 'createRole' || dialogState.type === 'editRole'}
        onOpenChange={() => setDialogState({ type: null })}
        onSave={handleSaveRole}
        role={dialogState.type === 'editRole' ? dialogState.data : null}
        workspaceFeatures={workspaceFeatures}
      />

      <AddUserDialog
        open={dialogState.type === 'addUser'}
        onOpenChange={() => setDialogState({ type: null })}
        onUserAdded={fetchData}
        roles={validRoles.filter(r => isMasterAdmin || r.name !== 'master admin')}
      />
    </PortalLayout>
  );
};

export default TeamSettingsPage;