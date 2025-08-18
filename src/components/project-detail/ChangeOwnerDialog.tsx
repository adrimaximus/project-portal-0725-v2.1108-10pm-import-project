import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChangeOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onOwnerChange: (newOwnerId: string) => Promise<void>;
}

const ChangeOwnerDialog = ({ open, onOpenChange, project, onOwnerChange }: ChangeOwnerDialogProps) => {
  const { user: currentUser } = useAuth();
  const [potentialOwners, setPotentialOwners] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser) return;

    const fetchPotentialOwners = async () => {
      setIsLoading(true);
      let query;
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'master admin';

      if (isAdmin) {
        // Admin dapat mentransfer ke pengguna mana pun kecuali pemilik saat ini
        query = supabase.from('profiles').select('*').neq('id', project.created_by.id);
      } else {
        // Pemilik hanya dapat mentransfer ke kolaborator yang sudah ada
        const collaboratorIds = project.assignedTo.map(u => u.id).filter(id => id !== project.created_by.id);
        if (collaboratorIds.length === 0) {
          setPotentialOwners([]);
          setIsLoading(false);
          return;
        }
        query = supabase.from('profiles').select('*').in('id', collaboratorIds);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Gagal mengambil data pengguna.");
      } else {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        }));
        setPotentialOwners(users);
      }
      setIsLoading(false);
    };

    fetchPotentialOwners();
  }, [open, currentUser, project]);

  const handleSelect = async (newOwnerId: string) => {
    await onOwnerChange(newOwnerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Kepemilikan Proyek</DialogTitle>
          <DialogDescription>Pilih pemilik baru untuk proyek ini. Pemilik saat ini akan menjadi anggota.</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Cari pengguna..." />
          <CommandList>
            {isLoading && <CommandEmpty>Memuat pengguna...</CommandEmpty>}
            {!isLoading && potentialOwners.length === 0 && <CommandEmpty>Tidak ada pengguna yang memenuhi syarat untuk ditransfer.</CommandEmpty>}
            <CommandGroup>
              {potentialOwners.map(user => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleSelect(user.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOwnerDialog;