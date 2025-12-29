import { useState, useEffect } from 'react';
import { Goal, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, UserCog, Crown } from 'lucide-react';
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
import { getInitials, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          const users: User[] = data.map(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            return {
              id: profile.id,
              name: fullName || profile.email || 'No name',
              avatar_url: getAvatarUrl(profile.avatar_url, profile.id),
              email: profile.email,
              initials: getInitials(fullName, profile.email) || 'NN',
              first_name: profile.first_name,
              last_name: profile.last_name,
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Collaborators</CardTitle>
          {isOwner && (
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
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
                              <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                              <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
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
        <CardContent>
          <div className="flex items-center -space-x-3 overflow-hidden p-1">
            <TooltipProvider>
              {goal.collaborators.map((user) => {
                const isGoalOwner = user.id === goal.user_id;
                const canManage = isOwner && !isGoalOwner;

                const AvatarComponent = (
                  <div
                    className={`relative inline-block rounded-full ring-2 ${
                      isGoalOwner ? 'ring-yellow-400 z-10' : 'ring-background hover:z-20 transition-all'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                      <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                    </Avatar>
                    {isGoalOwner && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-[1px] border border-background">
                        <Crown className="h-2.5 w-2.5 text-white" fill="currentColor" />
                      </div>
                    )}
                  </div>
                );

                return (
                  <div key={user.id}>
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {AvatarComponent}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.name} {isGoalOwner ? '(Owner)' : ''}</p>
                              <p className="text-xs text-muted-foreground">Click to manage</p>
                            </TooltipContent>
                          </Tooltip>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => setUserToMakeOwner(user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Make Owner
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {AvatarComponent}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name} {isGoalOwner ? '(Owner)' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
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