import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collaborator } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NewGroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewGroupChatDialog = ({ open, onOpenChange }: NewGroupChatDialogProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const fetchCollaborators = async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email');

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
            email: profile.email || '',
            initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
            online: true,
            avatar: profile.avatar_url || undefined,
          }));
        setCollaborators(fetchedCollaborators);
      }
    };

    fetchCollaborators();
  }, [currentUser]);

  const handleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredCollaborators = collaborators.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = () => {
    console.log("Creating group with:", selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>Select members for your new group.</DialogDescription>
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
                onClick={() => handleSelect(collaborator.id)}
              >
                <Checkbox
                  id={`cb-${collaborator.id}`}
                  checked={selected.includes(collaborator.id)}
                  onCheckedChange={() => handleSelect(collaborator.id)}
                />
                <Avatar>
                  <AvatarImage src={collaborator.avatar} />
                  <AvatarFallback>{collaborator.initials}</AvatarFallback>
                </Avatar>
                <Label htmlFor={`cb-${collaborator.id}`} className="cursor-pointer flex-grow">{collaborator.name}</Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleCreateGroup} disabled={selected.length === 0}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatDialog;