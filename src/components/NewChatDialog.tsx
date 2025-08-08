import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collaborator } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

interface NewChatDialogProps {
  onSelectCollaborator: (collaborator: Collaborator) => void;
  setOpen: (open: boolean) => void;
}

const NewChatDialog = ({ onSelectCollaborator, setOpen }: NewChatDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const { supabase, session } = useAuth();

  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!session?.user) return;

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .neq('id', session.user.id);

      if (error) {
        console.error('Error fetching collaborators:', error);
        return;
      }

      if (profiles) {
        const mappedCollaborators: Collaborator[] = profiles.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          fallback: `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase(),
          src: p.avatar_url,
          online: true, // Placeholder for online status
        }));
        setCollaborators(mappedCollaborators);
      }
    };

    fetchCollaborators();
  }, [supabase, session]);

  const filteredCollaborators = collaborators
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  const handleSelect = (collaborator: Collaborator) => {
    onSelectCollaborator(collaborator);
    setOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Obrolan Baru</DialogTitle>
        <DialogDescription>
          Pilih seorang kolaborator untuk memulai percakapan baru.
        </DialogDescription>
      </DialogHeader>
      <div className="relative my-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kolaborator..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-2 -mr-2">
        {filteredCollaborators.length > 0 ? (
          filteredCollaborators.map(collaborator => (
            <div
              key={collaborator.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => handleSelect(collaborator)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={collaborator.src} alt={collaborator.name} />
                  <AvatarFallback>{collaborator.fallback}</AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                  collaborator.online ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{collaborator.name}</p>
                <p className="text-sm text-muted-foreground">{collaborator.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">Kolaborator tidak ditemukan.</p>
        )}
      </div>
    </DialogContent>
  );
};

export default NewChatDialog;