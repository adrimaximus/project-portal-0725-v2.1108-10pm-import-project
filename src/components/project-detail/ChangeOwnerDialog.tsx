import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project, UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChangeOwnerDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onOwnerChanged: () => void;
}

const ChangeOwnerDialog = ({ project, isOpen, onClose, onOwnerChanged }: ChangeOwnerDialogProps) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser || !project.created_by || typeof project.created_by !== 'object') return;

    const fetchUsers = async () => {
      setIsLoading(true);
      let query;
      if (currentUser.role === 'admin' || currentUser.role === 'master admin') {
        // Admin can transfer to any user except the current owner
        query = supabase.from('profiles').select('*').neq('id', project.created_by.id);
      } else {
        // Owner can only transfer to existing collaborators
        const collaboratorIds = (project.assignedTo || []).map(u => u.id).filter(id => id !== (typeof project.created_by === 'object' ? project.created_by.id : project.created_by));
        if (collaboratorIds.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        query = supabase.from('profiles').select('*').in('id', collaboratorIds);
      }

      const { data, error } = await query;
      if (error) {
        toast.error('Failed to fetch users.', { description: error.message });
      } else {
        setUsers(data as UserProfile[]);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, [isOpen, currentUser, project]);

  const handleTransfer = async () => {
    if (!selectedUser) {
      toast.error('Please select a new owner.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.rpc('transfer_project_ownership', {
      p_project_id: project.id,
      p_new_owner_id: selectedUser.id,
    });

    if (error) {
      toast.error('Failed to transfer ownership.', { description: error.message });
    } else {
      toast.success(`Ownership transferred to ${selectedUser.name}.`);
      onOwnerChanged();
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Project Ownership</DialogTitle>
          <DialogDescription>
            Select a new owner for the project "{project.name}". The current owner will become a member.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
              >
                {selectedUser ? selectedUser.name : "Select new owner..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => {
                        setSelectedUser(user);
                        setPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                          <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleTransfer} disabled={isLoading || !selectedUser}>
            {isLoading ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOwnerDialog;