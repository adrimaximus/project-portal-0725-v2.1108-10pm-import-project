import { useState } from 'react';
import { Goal, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '../ui/badge';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onCollaboratorsUpdate: (updatedCollaborators: User[]) => void;
}

const GoalCollaborationManager = ({ goal, onCollaboratorsUpdate }: GoalCollaborationManagerProps) => {
  const { user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(goal.collaborators.map(c => c.id));
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [userToMakeOwner, setUserToMakeOwner] = useState<User | null>(null);

  const isOwner = currentUser?.id === goal.user_id;

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

  const handleTransferOwnership = async () => {
    if (!userToMakeOwner) return;

    const { error } = await supabase.rpc('transfer_goal_ownership', {
      p_goal_id: goal.id,
      p_new_owner_id: userToMakeOwner.id,
    });

    if (error) {
      toast.error("Failed to transfer ownership.", { description: error.message });
    } else {
      toast.success(`Ownership transferred to ${userToMakeOwner.name}.`);
      onCollaboratorsUpdate([]); // Trigger a refetch
    }
    setUserToMakeOwner(null);
  };

  if (!currentUser) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goal.collaborators.map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  {user.id === goal.user_id && <Badge variant="secondary">Owner</Badge>}
                </div>
              </div>
              {isOwner && user.id !== currentUser.id && (
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={() => setUserToMakeOwner(user)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Make Owner
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AlertDialog>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <AlertDialog open={!!userToMakeOwner} onOpenChange={() => setUserToMakeOwner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make {userToMakeOwner?.name} the new owner of this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransferOwnership}>Transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GoalCollaborationManager;