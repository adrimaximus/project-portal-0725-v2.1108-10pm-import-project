import { useState, Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collaborators, Collaborator } from "@/data/collaborators";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewGroupChatDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onStartNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
  isCollapsed?: boolean;
}

const NewGroupChatDialog = ({ open, setOpen, onStartNewGroupChat, isCollapsed }: NewGroupChatDialogProps) => {
  const [selected, setSelected] = useState<Collaborator[]>([]);
  const [groupName, setGroupName] = useState("");

  const handleSelect = (collaborator: Collaborator, isChecked: boolean) => {
    if (isChecked) {
      setSelected([...selected, collaborator]);
    } else {
      setSelected(selected.filter(c => c.name !== collaborator.name));
    }
  };

  const handleCreateGroup = () => {
    if (selected.length > 0 && groupName.trim()) {
      onStartNewGroupChat(selected, groupName);
      setOpen(false);
      setSelected([]);
      setGroupName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={isCollapsed ? "icon" : "sm"} className={cn(!isCollapsed && "w-full justify-start")}>
          <Users className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "New Group"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a group chat</DialogTitle>
          <DialogDescription>
            Select members and give your group a name.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Project Phoenix Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="space-y-1 max-h-[200px] overflow-y-auto border rounded-md p-2">
              {collaborators.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                >
                  <Checkbox
                    id={`member-${c.name}-${open}`}
                    onCheckedChange={(checked) => handleSelect(c, !!checked)}
                    checked={selected.some(s => s.name === c.name)}
                  />
                  <Label
                    htmlFor={`member-${c.name}-${open}`}
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.src} alt={c.name} />
                      <AvatarFallback>{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{c.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateGroup}
            disabled={selected.length === 0 || !groupName.trim()}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatDialog;