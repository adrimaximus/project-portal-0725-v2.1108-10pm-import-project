import { Project, AssignedUser, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, RefreshCw } from "lucide-react";
import ModernTeamSelector from "../request/ModernTeamSelector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";
import ChangeOwnerDialog from "./ChangeOwnerDialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface ProjectTeamCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectTeamCard = ({ project, isEditing, onFieldChange }: ProjectTeamCardProps) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();
  const [isChangeOwnerDialogOpen, setIsChangeOwnerDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const users = data.map(profile => {
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          return {
            id: profile.id,
            name: fullName || profile.email || 'No name',
            avatar_url: getAvatarUrl(profile.avatar_url, profile.id),
            email: profile.email,
            initials: getInitials(fullName, profile.email) || 'NN',
            first_name: profile.first_name,
            last_name: profile.last_name,
          }
        });
        setAllUsers(users);
      }
    };
    fetchUsers();
  }, []);

  const projectAdmins = project.assignedTo.filter(member => member.role === 'admin');
  const teamMembers = project.assignedTo.filter(member => member.role === 'member');

  const handleRoleChange = (userToToggle: User, role: 'admin' | 'member') => {
    const existingMember = project.assignedTo.find(u => u.id === userToToggle.id);
    let newTeam: AssignedUser[];

    if (existingMember && existingMember.role === role) {
      // User with same role clicked -> remove them
      newTeam = project.assignedTo.filter(u => u.id !== userToToggle.id);
    } else {
      // Add or change role
      // Remove user if they exist with a different role
      const filteredTeam = project.assignedTo.filter(u => u.id !== userToToggle.id);
      // Add them back with the new role
      const newUser: AssignedUser = {
        ...userToToggle,
        role: role,
      };
      newTeam = [...filteredTeam, newUser];
    }
    onFieldChange('assignedTo', newTeam);
  };

  const handleOwnerChange = async (newOwnerId: string) => {
    const { error } = await supabase.rpc('transfer_project_ownership', {
      p_project_id: project.id,
      p_new_owner_id: newOwnerId,
    });

    if (error) {
      toast.error("Failed to transfer ownership.", { description: error.message });
    } else {
      toast.success("Project ownership transferred. Reloading project...");
      setIsChangeOwnerDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  };

  const assignableUsers = project.created_by
    ? allUsers.filter(u => u.id !== project.created_by.id)
    : allUsers;
    
  const canChangeOwner = currentUser && (currentUser.id === project.created_by.id || currentUser.role === 'admin' || currentUser.role === 'master admin');

  const renderUserList = (users: AssignedUser[]) => (
    <div className="space-y-3">
      {users.map(member => (
        <div key={member.id} className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
            <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{member.name}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Project Owner */}
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT OWNER</h4>
              {isEditing && canChangeOwner && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsChangeOwnerDialogOpen(true)}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Change
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={getAvatarUrl(project.created_by.avatar_url, project.created_by.id)} />
                <AvatarFallback style={generatePastelColor(project.created_by.id)}>{project.created_by.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{project.created_by.name}</p>
              </div>
            </div>
          </div>

          {/* Project Admins */}
          {isEditing ? (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT ADMINS</h4>
              <ModernTeamSelector
                users={assignableUsers}
                selectedUsers={projectAdmins}
                onSelectionChange={(user) => handleRoleChange(user, 'admin')}
              />
            </div>
          ) : (
            projectAdmins.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT ADMINS</h4>
                {renderUserList(projectAdmins)}
              </div>
            )
          )}

          {/* Team Members */}
          {isEditing ? (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
              <ModernTeamSelector
                users={assignableUsers}
                selectedUsers={teamMembers}
                onSelectionChange={(user) => handleRoleChange(user, 'member')}
              />
            </div>
          ) : (
            teamMembers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
                {renderUserList(teamMembers)}
              </div>
            )
          )}
        </CardContent>
      </Card>
      {canChangeOwner && (
        <ChangeOwnerDialog
          open={isChangeOwnerDialogOpen}
          onOpenChange={setIsChangeOwnerDialogOpen}
          project={project}
          onOwnerChange={handleOwnerChange}
        />
      )}
    </>
  );
};

export default ProjectTeamCard;