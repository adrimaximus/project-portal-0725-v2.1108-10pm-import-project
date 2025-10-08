import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssignedUser } from "@/types";
import { generatePastelColor } from "@/lib/utils";

interface ModernTeamSelectorProps {
  selectedUsers: AssignedUser[];
  onChange: (users: AssignedUser[]) => void;
}

export function ModernTeamSelector({ selectedUsers, onChange }: ModernTeamSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: profile.role,
          initials: (fullName ? (fullName.split(' ')[0][0] + (fullName.split(' ').length > 1 ? fullName.split(' ')[1][0] : '')) : profile.email[0]).toUpperCase(),
        };
      });
    },
  });

  const handleSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      onChange(selectedUsers.filter(u => u.id !== user.id));
    } else {
      onChange([...selectedUsers, { ...user, role: 'member' }]);
    }
  };

  const handleRoleChange = (userId: string, role: 'member' | 'editor' | 'viewer') => {
    onChange(selectedUsers.map(u => u.id === userId ? { ...u, role } : u));
  };

  const selectedUserIds = useMemo(() => new Set(selectedUsers.map(u => u.id)), [selectedUsers]);

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length} member(s) selected`
              : 'Select team members...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search for users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map(user => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        selectedUserIds.has(user.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="space-y-3">
          {selectedUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Role selector can be added here if needed */}
                <Button variant="ghost" size="icon" onClick={() => handleSelect(user)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}