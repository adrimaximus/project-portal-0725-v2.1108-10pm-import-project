import { File as FileIcon } from 'lucide-react';

interface MessageAttachmentProps {
  attachment: {
    name: string;
    url: string;
    type: string;
  };
}

const MessageAttachment = ({ attachment }: MessageAttachmentProps) => {
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="mt-2 flex items-center gap-3 rounded-lg border p-2 bg-background/50 hover:bg-background transition-colors max-w-xs"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-medium text-sm truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">Klik untuk mengunduh</p>
      </div>
    </a>
  );
};

export default MessageAttachment;