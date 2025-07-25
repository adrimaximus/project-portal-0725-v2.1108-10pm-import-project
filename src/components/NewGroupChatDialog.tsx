import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collaborators } from "@/data/collaborators";
import { Collaborator } from "@/types";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

interface NewGroupChatDialogProps {
  onStartGroupChat: (groupName: string, members: Collaborator[]) => void;
  setOpen: (open: boolean) => void;
}

const NewGroupChatDialog = ({ onStartGroupChat, setOpen }: NewGroupChatDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [groupName, setGroupName] = useState("");

  const handleSelectCollaborator = (collaborator: Collaborator) => {
    setSelectedCollaborators((prev) =>
      prev.some((c) => c.id === collaborator.id)
        ? prev.filter((c) => c.id !== collaborator.id)
        : [...prev, collaborator]
    );
  };

  const filteredCollaborators = collaborators.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedCollaborators.length > 0) {
      onStartGroupChat(groupName, selectedCollaborators);
      setOpen(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create a New Group Chat</DialogTitle>
        <DialogDescription>
          Select members and give your group a name.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="group-name">Group Name</Label>
          <Input
            id="group-name"
            placeholder="e.g., Project Alpha Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Select Members</Label>
          <Input
            placeholder="Search collaborators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-[200px] w-full rounded-md border p-2">
            <div className="space-y-2">
              {filteredCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                      <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{collaborator.name}</span>
                  </div>
                  <Checkbox
                    checked={selectedCollaborators.some((c) => c.id === collaborator.id)}
                    onCheckedChange={() => handleSelectCollaborator(collaborator)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedCollaborators.length < 1}
        >
          Create Group
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NewGroupChatDialog;