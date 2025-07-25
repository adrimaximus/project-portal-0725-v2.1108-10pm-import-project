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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { allCollaborators as collaborators } from "@/data/collaborators";
import { Collaborator } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewGroupChatDialogProps {
  onStartNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
  setOpen: (open: boolean) => void;
}

const NewGroupChatDialog = ({ onStartNewGroupChat, setOpen }: NewGroupChatDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);

  const handleSelectCollaborator = (collaborator: Collaborator) => {
    setSelectedCollaborators((prev) =>
      prev.some((c) => c.id === collaborator.id)
        ? prev.filter((c) => c.id !== collaborator.id)
        : [...prev, collaborator]
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedCollaborators.length > 0) {
      onStartNewGroupChat(selectedCollaborators, groupName);
      setOpen(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create a new group chat</DialogTitle>
        <DialogDescription>
          Select members and give your group a name.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="group-name" className="text-right">
            Group Name
          </Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="col-span-3"
            placeholder="e.g., Project Alpha Team"
          />
        </div>
        <div className="space-y-2">
          <Label>Select Members</Label>
          <ScrollArea className="h-[200px] w-full rounded-md border p-2">
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted"
                  onClick={() => handleSelectCollaborator(collaborator)}
                >
                  <Checkbox
                    id={`collaborator-${collaborator.id}`}
                    checked={selectedCollaborators.some((c) => c.id === collaborator.id)}
                    onCheckedChange={() => handleSelectCollaborator(collaborator)}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor={`collaborator-${collaborator.id}`}
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={collaborator.src} alt={collaborator.name} />
                      <AvatarFallback>{collaborator.fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{collaborator.name}</p>
                      <p className="text-sm text-muted-foreground">{collaborator.online ? 'Online' : 'Offline'}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedCollaborators.length === 0}
        >
          Create Group
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NewGroupChatDialog;