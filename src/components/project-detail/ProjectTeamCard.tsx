import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Project, User, AssignedUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Crown, MoreVertical } from "lucide-react";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
import { ChangeOwnerDialog } from "./ChangeOwnerDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const ProjectTeamCard = ({ project }: { project: Project }) => {
  const { user: currentUser } = useAuth();
  const [isAddMemberOpen, setAddMemberOpen] = useState(false);
  const [isChangeOwnerOpen, setChangeOwnerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery<AssignedUser[]>({
    queryKey: ["project-team", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("role, profiles(*)")
        .eq("project_id", project.id);

      if (error) throw error;

      return data.map((item: any) => {
        const profile = item.profiles;
        const fullName = `${profile.first_name || ""} ${
          profile.last_name || ""
        }`.trim();
        return {
          id: profile.id,
          name: fullName || profile.email || "No name",
          avatar_url: getAvatarUrl(profile.avatar_url),
          email: profile.email,
          role: item.role,
          initials: getInitials(fullName, profile.email),
        };
      });
    },
  });

  const isOwner = currentUser?.id === project.created_by.id;

  const removeMember = async (memberId: string) => {
    if (memberId === project.created_by.id) {
      toast.error("Cannot remove the project owner.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", memberId);

    if (error) {
      toast.error("Failed to remove member: " + error.message);
    } else {
      toast.success("Member removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["project-team", project.id] });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Team
        </CardTitle>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p>Loading team...</p>
        ) : (
          <>
            {/* Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={getAvatarUrl(project.created_by.avatar_url) || undefined} />
                  <AvatarFallback style={{ backgroundColor: generatePastelColor(project.created_by.id) }}>{project.created_by.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{project.created_by.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.created_by.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Owner</span>
                {isOwner && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setChangeOwnerOpen(true)}
                    className="text-xs"
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>

            {/* Members */}
            {members
              ?.filter((m) => m.id !== project.created_by.id)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(member.avatar_url) || undefined} />
                      <AvatarFallback style={{ backgroundColor: generatePastelColor(member.id) }}>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize text-muted-foreground">
                      {member.role}
                    </span>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => removeMember(member.id)}
                          >
                            Remove from project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </CardContent>
      <AddTeamMemberDialog
        project={project}
        isOpen={isAddMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        existingMembers={members || []}
      />
      <ChangeOwnerDialog
        project={project}
        isOpen={isChangeOwnerOpen}
        onClose={() => setChangeOwnerOpen(false)}
      />
    </Card>
  );
};

export default ProjectTeamCard;