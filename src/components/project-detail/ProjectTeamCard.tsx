import { Project, AssignedUser, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Crown, MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import ChangeOwnerDialog from "./ChangeOwnerDialog";

interface ProjectTeamCardProps {
  project: Project;
  onProjectUpdate: () => void;
}

const ProjectTeamCard = ({ project, onProjectUpdate }: ProjectTeamCardProps) => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isChangeOwnerOpen, setIsChangeOwnerOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setAllUsers(data as UserProfile[]);
      }
    };
    fetchUsers();
  }, []);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    const existingMemberIds = project.assignedTo?.map(m => m.id) || [];
    if (typeof project.created_by === 'object' && project.created_by.id) {
      existingMemberIds.push(project.created_by.id);
    }

    if (existingMemberIds.includes(selectedUser)) {
      toast.info("User is already a member of this project.");
      return;
    }

    const { error } = await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: selectedUser,
    });

    if (error) {
      toast.error("Failed to add member.", { description: error.message });
    } else {
      toast.success("Member added successfully.");
      onProjectUpdate();
      setIsAddingMember(false);
      setSelectedUser(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await supabase.from('project_members').delete()
      .eq('project_id', project.id)
      .eq('user_id', userId);

    if (error) {
      toast.error("Failed to remove member.", { description: error.message });
    } else {
      toast.success("Member removed successfully.");
      onProjectUpdate();
    }
  };

  const assignableUsers = (typeof project.created_by === 'object' && project.created_by.id)
    ? allUsers.filter(u => u.id !== project.created_by.id)
    : allUsers;

  const teamMembers = (project.assignedTo || []).filter(member => 
    typeof project.created_by === 'object' ? member.id !== project.created_by.id : true
  );

  const canChangeOwner = currentUser && typeof project.created_by === 'object' && (currentUser.id === project.created_by.id || currentUser.role === 'admin' || currentUser.role === 'master admin');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Team</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsAddingMember(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {typeof project.created_by === 'object' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(project.created_by.avatar_url, project.created_by.id)} />
                  <AvatarFallback style={generatePastelColor(project.created_by.id)}>{project.created_by.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{project.created_by.name}</p>
                  <p className="text-xs text-muted-foreground">{project.created_by.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <Crown className="h-4 w-4" />
                <span>Owner</span>
              </div>
            </div>
          )}

          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
                  <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {isAddingMember && (
            <div className="flex items-center gap-2">
              <Select onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers
                    .filter(u => !(project.assignedTo || []).find(m => m.id === u.id))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} size="sm">Add</Button>
              <Button onClick={() => setIsAddingMember(false)} size="sm" variant="outline">Cancel</Button>
            </div>
          )}
        </div>
        {canChangeOwner && (
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setIsChangeOwnerOpen(true)}>
            Transfer Ownership
          </Button>
        )}
      </CardContent>
      <ChangeOwnerDialog
        project={project}
        isOpen={isChangeOwnerOpen}
        onClose={() => setIsChangeOwnerOpen(false)}
        onOwnerChanged={onProjectUpdate}
      />
    </Card>
  );
};

export default ProjectTeamCard;