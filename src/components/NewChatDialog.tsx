import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collaborator } from '@/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewChatDialog = ({ open, onOpenChange }: NewChatDialogProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const fetchCollaborators = async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url');

      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }

      if (profiles) {
        const fetchedCollaborators = profiles
          .filter(profile => profile.id !== currentUser.id)
          .map((profile): Collaborator => ({
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
            online: true, // Simulate online status
            avatar: profile.avatar_url || undefined,
          }));
        setCollaborators(fetchedCollaborators);
      }
    };

    fetchCollaborators();
  }, [currentUser]);

  const filteredCollaborators = collaborators.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCollaborator = (collaborator: Collaborator) => {
    onOpenChange(false);
    navigate('/chat', { state: { selectedCollaborator: collaborator } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Select a collaborator to start a conversation.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Search collaborators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredCollaborators.map(collaborator => (
              <div
                key={collaborator.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleSelectCollaborator(collaborator)}
              >
                <Avatar>
                  <AvatarImage src={collaborator.avatar} />
                  <AvatarFallback>{collaborator.initials}</AvatarFallback>
                </Avatar>
                <span>{collaborator.name}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;