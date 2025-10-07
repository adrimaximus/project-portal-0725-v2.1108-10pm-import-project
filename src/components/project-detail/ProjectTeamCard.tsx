import { useState } from "react";
import { Project, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, User as UserIcon, Crown, Shield, Trash2, MoreHorizontal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { MultiSelect } from "../ui/multi-select";

interface ProjectTeamCardProps {
  project: Project;
}

const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email || 'No name',
          avatar_url: getAvatarUrl(profile),
          email: profile.email,
          initials: getInitials(fullName) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          status: profile.status,
          updated_at: profile.updated_at,
        };
      });
    },
  });
};

const ProjectTeamCard = ({ project }: ProjectTeamCardProps) => {
  const { user: currentUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data: allProfiles = [] } = useProfiles();
  const queryClient = useQueryClient();

  const isOwner = currentUser?.id === project.created_by.id;

  const { mutate: updateMembers, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedMemberIds: string[]) => {
      // First, remove members who are no longer selected (but not the owner)
      const membersToRemove = project.assignedTo
        ?.filter(m => !updatedMemberIds.includes(m.id) && m.id !== project.created_by.id)
        .map(m => m.id) || [];

      if (membersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', project.id)
          .in('user_id', membersToRemove);
        if (deleteError) throw new Error(`Failed to remove members: ${deleteError.message}`);
      }

      // Then, add new members
      const existingMemberIds = project.assignedTo?.map(m => m.id) || [];
      const membersToAdd = updatedMemberIds
        .filter(id => !existingMemberIds.includes(id))
        .map(id => ({ project_id: project.id, user_id: id, role: 'member' }));

      if (membersToAdd.length > 0) {
        const { error: insertError } = await supabase.from('project_members').insert(membersToAdd);
        if (insertError) throw new Error(`Failed to add members: ${insertError.message}`);
      }
    },
    onSuccess: () => {
      toast.success("Team updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      setIsAdding(false);
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddMembers = () => {
    const currentMemberIds = project.assignedTo?.map(m => m.id) || [];
    updateMembers([...currentMemberIds, ...selectedUsers]);
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === project.created_by.id) {
      toast.error("Cannot remove the project owner.");
      return;
    }
    const updatedMemberIds = project.assignedTo?.map(m => m.id).filter(id => id !== memberId) || [];
    updateMembers(updatedMemberIds);
  };

  const memberOptions = allProfiles
    .filter(p => !project.assignedTo?.some(m => m.id === p.id))
    .map(p => ({ value: p.id, label: p.name }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Team</CardTitle>
          {isOwner && !isAdding && (
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={getAvatarUrl(project.created_by)} />
                <AvatarFallback style={generatePastelColor(project.created_by.id)}>{project.created_by.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{project.created_by.name}</p>
                <p className="text-xs text-muted-foreground">{project.created_by.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <Crown className="h-4 w-4" />
              Owner
            </div>
          </div>

          {/* Other Members */}
          {project.assignedTo?.filter(m => m.id !== project.created_by.id).map(member => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(member)} />
                  <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="space-y-2 pt-4 border-t">
              <MultiSelect
                options={memberOptions}
                selected={selectedUsers}
                onChange={setSelectedUsers}
                placeholder="Select team members..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleAddMembers} disabled={isUpdating || selectedUsers.length === 0}>
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Members
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;