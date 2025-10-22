import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import FileIcon from './FileIcon';

// More flexible type to handle different data shapes from the database
interface AttachmentFile {
  id?: string;
  name?: string;
  file_name?: string;
  size?: number;
  file_size?: number;
  type?: string;
  file_type?: string;
  url?: string;
  file_url?: string;
}

interface CommentAttachmentItemProps {
  file: AttachmentFile;
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

  // Handle inconsistent property names from different data sources
  const name = file.name || file.file_name;
  const url = file.url || file.file_url;
  const type = file.type || file.file_type;
  const size = file.size || file.file_size;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
      <div className="flex items-center gap-3 truncate min-w-0">
        <FileIcon fileType={type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">{name}</span>
          {size != null && size > 0 && (
            <span className="text-xs text-muted-foreground">{formatBytes(size)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <a href={url} target="_blank" rel="noopener noreferrer" title="View file">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!url}>
            <Eye className="h-4 w-4" />
          </Button>
        </a>
        <a href={url} download={name} title="Download file">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!url}>
            <Download className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
};

export default CommentAttachmentItem;