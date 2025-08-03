import { useState } from 'react';
import { Goal } from '@/data/goals';
import { User, dummyUsers } from '@/data/users';
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

interface GoalCollaborationManagerProps {
  goal: Goal;
  onCollaboratorsUpdate: (updatedCollaborators: User[]) => void;
}

const GoalCollaborationManager = ({ goal, onCollaboratorsUpdate }: GoalCollaborationManagerProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>(goal.collaborators.map(c => c.id));

  const handleUserSelect = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSaveChanges = () => {
    const updatedCollaborators = dummyUsers.filter(u => selectedUsers.includes(u.id));
    onCollaboratorsUpdate(updatedCollaborators);
    toast.success('Collaborators updated successfully!');
  };

  const availableUsers = dummyUsers.filter(u => u.id !== 'user-0'); // Exclude current user

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {goal.collaborators.map(user => (
            <Avatar key={user.id}>
              <AvatarImage src={user.avatarUrl} alt={user.name} />
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
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
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