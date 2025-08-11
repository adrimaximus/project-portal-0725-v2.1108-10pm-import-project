import { useState, useEffect } from 'react';
import { Goal, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onCollaboratorsUpdate: (updatedCollaborators: User[]) => void;
}

export default function GoalCollaborationManager({ goal, onCollaboratorsUpdate }: GoalCollaborationManagerProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        toast.error("Failed to fetch users.");
      } else {
        setAllUsers(data as User[]);
      }
    };
    fetchUsers();
  }, []);

  const handleAddCollaborator = async (user: User) => {
    const { error } = await supabase.from('goal_collaborators').insert({
      goal_id: goal.id,
      user_id: user.id,
    });
    if (error) {
      toast.error(`Failed to add collaborator: ${error.message}`);
    } else {
      onCollaboratorsUpdate([...goal.collaborators, user]);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    const { error } = await supabase.from('goal_collaborators').delete()
      .eq('goal_id', goal.id)
      .eq('user_id', userId);
    if (error) {
      toast.error(`Failed to remove collaborator: ${error.message}`);
    } else {
      onCollaboratorsUpdate(goal.collaborators.filter(c => c.id !== userId));
    }
  };

  const filteredUsers = allUsers.filter(u =>
    !goal.collaborators.some(c => c.id === u.id) &&
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <h4 className="font-semibold mb-2">Collaborators</h4>
      <div className="space-y-2 mb-4">
        {goal.collaborators.map(c => (
          <div key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.avatar_url || undefined} />
                <AvatarFallback>{c.initials}</AvatarFallback>
              </Avatar>
              <span>{c.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveCollaborator(c.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Search to add collaborators..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <div className="border rounded-md max-h-40 overflow-y-auto">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted">
                <span>{u.name}</span>
                <Button size="sm" onClick={() => handleAddCollaborator(u)}>Add</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}