import { Project, AssignedUser, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import ModernTeamSelector from "../request/ModernTeamSelector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectTeamCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectTeamCard = ({ project, isEditing, onFieldChange }: ProjectTeamCardProps) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setAllUsers(users);
      }
    };
    fetchUsers();
  }, []);

  const handleTeamSelectionToggle = (userToToggle: AssignedUser) => {
    const isSelected = project.assignedTo.some(u => u.id === userToToggle.id);
    const newTeam = isSelected
      ? project.assignedTo.filter(u => u.id !== userToToggle.id)
      : [...project.assignedTo, userToToggle];
    onFieldChange('assignedTo', newTeam);
  };

  const assignableUsers = project.created_by
    ? allUsers.filter(u => u.id !== project.created_by.id)
    : allUsers;
    
  const teamMembers = project.assignedTo.filter(member => member.id !== project.created_by.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Team</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isEditing ? (
          <>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT OWNER</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={project.created_by.avatar} />
                  <AvatarFallback>{project.created_by.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{project.created_by.name}</p>
                  <p className="text-xs text-muted-foreground">{project.created_by.email}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
              <ModernTeamSelector
                users={assignableUsers}
                selectedUsers={teamMembers}
                onSelectionChange={handleTeamSelectionToggle}
              />
            </div>
          </>
        ) : (
          <>
            {project.created_by && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT OWNER</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={project.created_by.avatar} />
                    <AvatarFallback>{project.created_by.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{project.created_by.name}</p>
                    <p className="text-xs text-muted-foreground">{project.created_by.email}</p>
                  </div>
                </div>
              </div>
            )}
            {teamMembers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;