import { useState, useEffect } from 'react';
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
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { getInitials, generateVibrantGradient } from '@/lib/utils';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onCollaboratorsUpdate: (updatedCollaborators: User[]) => void;
}

const GoalCollaborationManager = ({ goal, onCollaboratorsUpdate }: GoalCollaborationManagerProps) => {
  const { user: currentUser } = useAuth();
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(goal.collaborators.map(c => c.id));
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [userToMakeOwner, setUserToMakeOwner] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isOwner = currentUser?.id === goal.user_id;

  useEffect(() => {
    setSelectedUserIds(goal.collaborators.map(c => c.id));
  }, [goal.collaborators]);

  useEffect(() => {
    if (isManageDialogOpen) {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (data) {
          const users = data.map(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            return {
              id: profile.id,
              name: fullName || profile.email || 'No name',
              avatar: profile.avatar_url,
              email: profile.email,
              initials: getInitials(fullName, profile.email) || 'NN',
            }
          });
          setAvailableUsers(users);
        }
      };
      fetchUsers();
    }
  }, [isManageDialogOpen]);

  const handleUserSelect = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSaveChanges = () => {
    const updatedCollaborators = availableUsers.filter(u => selectedUserIds.includes(u.id));
    onCollaboratorsUpdate(updatedCollaborators);
    setIsManageDialogOpen(false);
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

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!currentUser) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Collaborators</CardTitle>
          {isOwner && (
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Collaborators</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                      {filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, !!checked)}
                            disabled={user.id === goal.user_id}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {goal.collaborators.map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  {user.id === goal.user_id && <Badge variant="secondary">Owner</Badge>}
                </div>
              </div>
              {isOwner && user.id !== currentUser.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setUserToMakeOwner(user)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Make Owner
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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