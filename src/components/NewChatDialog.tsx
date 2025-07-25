import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collaborators } from "@/data/collaborators";
import { Collaborator } from "@/types";
import { ScrollArea } from "./ui/scroll-area";

interface NewChatDialogProps {
  onSelectCollaborator: (collaborator: Collaborator) => void;
  setOpen: (open: boolean) => void;
}

const NewChatDialog = ({ onSelectCollaborator, setOpen }: NewChatDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCollaborators = collaborators.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (collaborator: Collaborator) => {
    onSelectCollaborator(collaborator);
    setOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Start a New Chat</DialogTitle>
        <DialogDescription>
          Select a collaborator to start a one-on-one conversation.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <Input
          placeholder="Search collaborators..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-2">
            {filteredCollaborators.map((collaborator) => (
              <button
                key={collaborator.id}
                onClick={() => handleSelect(collaborator)}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                  <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{collaborator.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  );
};

export default NewChatDialog;