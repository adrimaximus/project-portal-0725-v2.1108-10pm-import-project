import { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collaborators, Collaborator } from "@/data/collaborators";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewChatDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSelectCollaborator: (collaborator: Collaborator) => void;
  isCollapsed?: boolean;
}

const NewChatDialog = ({ open, setOpen, onSelectCollaborator, isCollapsed }: NewChatDialogProps) => {
  const handleSelect = (collaborator: Collaborator) => {
    onSelectCollaborator(collaborator);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={isCollapsed ? "icon" : "sm"} className={cn(!isCollapsed && "w-full justify-start")}>
          <PlusCircle className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "New Chat"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
          <DialogDescription>
            Select a collaborator to start a one-on-one conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4 max-h-[300px] overflow-y-auto">
          {collaborators.map((c) => (
            <button
              key={c.name}
              className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-muted"
              onClick={() => handleSelect(c)}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={c.src} alt={c.name} />
                <AvatarFallback>{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;