import { ChatMessageAttachment } from "@/types";
import { File, Download } from "lucide-react";
import { Button } from "./ui/button";

interface MessageAttachmentProps {
  attachment: ChatMessageAttachment;
}

const MessageAttachment = ({ attachment }: MessageAttachmentProps) => {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border bg-background/50 p-2">
      <File className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
      </div>
      <a href={attachment.url} download={attachment.name} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
};

export default MessageAttachment;