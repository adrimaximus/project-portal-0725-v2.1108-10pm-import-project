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

  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const isMasterAdmin = currentUser?.role === 'master admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;

  const handleSaveRole = (role: Role) => {
    saveRole(role, {
      onSuccess: () => {
        setRoleToEdit(null);
        setIsCreateRoleOpen(false);
      },
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
          onCreateRole={() => setIsCreateRoleOpen(true)}
          onEditRole={(role) => setRoleToEdit(role)}
          onDeleteRole={(role) => setRoleToDelete(role)}
        />

        {isAdmin && (
          <InviteCard
            roles={validRoles}
            onSendInvites={(invites) => sendInvites(invites)}
            onAddManually={() => setIsAddUserOpen(true)}
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
          onDeleteMember={(member) => setMemberToDelete(member)}
          onResendInvite={resendInvite}
        />
      </div>

      {/* Dialogs */}
      {memberToDelete && (
        <ConfirmationDialog
          open={!!memberToDelete}
          onOpenChange={() => setMemberToDelete(null)}
          onConfirm={() => deleteMember(memberToDelete)}
          title="Are you sure?"
          description={
            memberToDelete.status === 'Pending invite'
              ? `This will cancel the invitation for ${memberToDelete.email}. They will not be able to join the team with the current link.`
              : `This will permanently delete ${memberToDelete.name} from the team. This action cannot be undone.`
          }
          confirmText={memberToDelete.status === 'Pending invite' ? 'Cancel Invite' : 'Delete'}
        />
      )}

      {roleToDelete && (
        <ConfirmationDialog
          open={!!roleToDelete}
          onOpenChange={() => setRoleToDelete(null)}
          onConfirm={() => deleteRole(roleToDelete)}
          title="Are you sure?"
          description={`This will permanently delete the "${roleToDelete.name}" role. This action cannot be undone.`}
          confirmText="Delete"
        />
      )}

      <RoleManagerDialog
        open={isCreateRoleOpen || !!roleToEdit}
        onOpenChange={() => {
          setIsCreateRoleOpen(false);
          setRoleToEdit(null);
        }}
        onSave={handleSaveRole}
        role={roleToEdit}
        workspaceFeatures={workspaceFeatures}
      />

      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onUserAdded={fetchData}
        roles={validRoles.filter(r => isMasterAdmin || r.name !== 'master admin')}
      />
    </PortalLayout>
  );
};

export default TeamSettingsPage;