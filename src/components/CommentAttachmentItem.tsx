import { TaskAttachment } from '@/types';
import { Download, Eye, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { formatBytes } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface CommentAttachmentItemProps {
  file: TaskAttachment;
}

const isImage = (fileName?: string) => {
  if (!fileName) return false;
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? imageExtensions.includes(extension) : false;
};

const CommentAttachmentItem = ({ file }: CommentAttachmentItemProps) => {
  const url = file.file_url || file.url;
  const name = file.file_name || file.name;

  if (!url || !name) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-md border text-destructive">
        <FileText className="h-5 w-5" />
        <p className="text-sm font-medium">Attachment data is invalid.</p>
      </div>
    );
  }

  const handleView = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(() => {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {isImage(name) ? (
          <img src={url} alt={name} className="h-10 w-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{name}</p>
          {file.file_size != null && (
            <p className="text-xs text-muted-foreground">{formatBytes(file.file_size)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleView}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View file</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default CommentAttachmentItem;