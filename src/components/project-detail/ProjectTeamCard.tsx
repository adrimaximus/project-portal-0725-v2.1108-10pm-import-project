import { Project, AssignedUser, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Edit } from "lucide-react";
import ModernTeamSelector from "../request/ModernTeamSelector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";
import ChangeOwnerDialog from "./ChangeOwnerDialog";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface ProjectTeamCardProps {
  project: Project;
}

const ProjectTeamCard = ({ project }: ProjectTeamCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeam, setEditedTeam] = useState<AssignedUser[]>(project.assignedTo);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();
  const [isChangeOwnerDialogOpen, setIsChangeOwnerDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    setEditedTeam(project.assignedTo);
  }, [project.assignedTo]);

  useEffect(() => {
    if (isEditing) {
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
              role: profile.role,
            }
          });
          setAllUsers(users);
        }
      };
      fetchUsers();
    }
  }, [isEditing]);

  const handleMention = (user: User | AssignedUser) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tab', 'discussion');
    searchParams.set('mention', user.id);
    searchParams.set('mentionName', user.name || '');
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  const updateTeamMutation = useMutation({
    mutationFn: async (newTeam: AssignedUser[]) => {
      const { error } = await supabase.rpc('update_project_details', {
        p_project_id: project.id,
        p_members: newTeam,
        p_name: null, p_description: null, p_category: null, p_status: null, p_budget: null,
        p_start_date: null, p_due_date: null, p_payment_status: null, p_payment_due_date: null,
        p_venue: null, p_service_titles: null, p_existing_tags: null, p_custom_tags: null,
        p_invoice_number: null, p_po_number: null, p_paid_date: null, p_email_sending_date: null, 
        p_hardcopy_sending_date: null, p_channel: null,
        p_client_company_id: project.client_company_id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update team.", { description: error.message });
    }
  });

  const handleRoleChange = (userToToggle: User, role: 'admin' | 'member') => {
    const existingMember = editedTeam.find(u => u.id === userToToggle.id);
    let newTeam: AssignedUser[];

    if (existingMember && existingMember.role === role) {
      newTeam = editedTeam.filter(u => u.id !== userToToggle.id);
    } else {
      const filteredTeam = editedTeam.filter(u => u.id !== userToToggle.id);
      const newUser: AssignedUser = { ...userToToggle, role: role };
      newTeam = [...filteredTeam, newUser];
    }
    setEditedTeam(newTeam);
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

  const handleSave = () => {
    updateTeamMutation.mutate(editedTeam);
  };

  const handleCancel = () => {
    setEditedTeam(project.assignedTo);
    setIsEditing(false);
  };

  const currentTeam = isEditing ? editedTeam : project.assignedTo;
  const projectAdmins = currentTeam.filter(member => member.role === 'admin' && member.id !== project.created_by?.id);
  const teamMembers = currentTeam.filter(member => member.role === 'member' && member.id !== project.created_by?.id);
  const assignableUsers = project.created_by ? allUsers.filter(u => u.id !== project.created_by.id) : allUsers;
  const canChangeOwner = currentUser && (currentUser.id === project.created_by.id || currentUser.role === 'admin' || currentUser.role === 'master admin');

  const renderUserList = (users: AssignedUser[]) => (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {users.map(member => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <button onClick={() => handleMention(member)} className="p-0 m-0 bg-transparent border-none rounded-full cursor-pointer">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
                  <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{member.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT OWNER</h4>
              {isEditing && canChangeOwner && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsChangeOwnerDialogOpen(true)}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Change
                </Button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => handleMention(project.created_by)} className="p-0 m-0 bg-transparent border-none rounded-full cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(project.created_by.avatar_url, project.created_by.id)} />
                      <AvatarFallback style={generatePastelColor(project.created_by.id)}>{project.created_by.initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.created_by.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isEditing ? (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT ADMIN</h4>
              <ModernTeamSelector users={assignableUsers} selectedUsers={projectAdmins} onSelectionChange={(user) => handleRoleChange(user, 'admin')} />
            </div>
          ) : (
            projectAdmins.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT ADMIN</h4>
                {renderUserList(projectAdmins)}
              </div>
            )
          )}

          {isEditing ? (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
              <ModernTeamSelector users={assignableUsers} selectedUsers={teamMembers} onSelectionChange={(user) => handleRoleChange(user, 'member')} />
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
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateTeamMutation.isPending}>
              {updateTeamMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {canChangeOwner && (
        <ChangeOwnerDialog open={isChangeOwnerDialogOpen} onOpenChange={setIsChangeOwnerDialogOpen} project={project} onOwnerChange={handleOwnerChange} />
      )}
    </div>
  );
};

export default ProjectTeamCard;