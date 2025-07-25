import { File as FileIcon } from 'lucide-react';

interface MessageAttachmentProps {
  attachment: {
    name: string;
    url: string;
    type: string;
  };
}

const MessageAttachment = ({ attachment }: MessageAttachmentProps) => {
  const isImage = attachment.type.startsWith('image/');

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="mt-2 flex items-center gap-3 rounded-lg border p-2 bg-muted/20 hover:bg-muted/50 transition-colors max-w-xs"
      target="_blank"
      rel="noopener noreferrer"
    >
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-10 w-10 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="font-medium text-sm truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">Klik untuk mengunduh</p>
      </div>
    </a>
  );
};

export default MessageAttachment;