import { Button } from "./ui/button";
import { Forward, Trash2, X } from "lucide-react";

interface ChatSelectionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  onForward: () => void;
}

const ChatSelectionBar = ({ selectedCount, onCancel, onDelete, onForward }: ChatSelectionBarProps) => {
  return (
    <div className="border-t p-4 flex-shrink-0 flex items-center justify-between bg-muted/50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
        <p className="font-semibold">{selectedCount} selected</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onForward}>
          <Forward className="h-5 w-5" />
        </Button>
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatSelectionBar;