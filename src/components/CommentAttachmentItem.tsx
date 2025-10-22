import React from 'react';
import { ProjectFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import FileIcon from './FileIcon';

interface CommentAttachmentItemProps {
  file: ProjectFile;
}

const CommentAttachmentItem: React.FC<CommentAttachmentItemProps> = ({ file }) => {
  const formatBytes = (bytes: number | null | undefined, decimals = 2) => {
    if (bytes === 0 || bytes == null) return '';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
      <div className="flex items-center gap-3 truncate min-w-0">
        <FileIcon fileType={file.type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">{file.name}</span>
          {file.size != null && file.size > 0 && (
            <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <a href={file.url} target="_blank" rel="noopener noreferrer" title="View file">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        </a>
        <a href={file.url} download={file.name} title="Download file">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
};

export default CommentAttachmentItem;