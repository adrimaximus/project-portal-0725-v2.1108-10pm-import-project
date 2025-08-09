import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onCollaboratorsUpdate: (updatedCollaborators: User[]) => void;
}

const GoalCollaborationManager = ({ goal, onCollaboratorsUpdate }: GoalCollaborationManagerProps) => {
  const { user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(goal.collaborators.map(c => c.id));
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && currentUser) {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setAvailableUsers(users.filter(u => u.id !== currentUser.id));
      }
    };
    fetchUsers();
  }, [currentUser]);

  const handleUserSelect = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSaveChanges = () => {
    const updatedCollaborators = availableUsers.filter(u => selectedUsers.includes(u.id));
    onCollaboratorsUpdate(updatedCollaborators);
    toast.success('Collaborators updated successfully!');
  };

  if (!currentUser) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {goal.collaborators.map(user => (
            <Avatar key={user.id}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          ))}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborators</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {availableUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelect(user.id, !!checked)}
                    />
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`user-${user.id}`} className="font-medium">{user.name}</Label>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalCollaborationManager;