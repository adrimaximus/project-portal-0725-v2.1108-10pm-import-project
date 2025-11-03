import { useState } from 'react';
import { TaskAttachment } from "@/types";
import FileIcon from "../FileIcon";
import { Button } from "../ui/button";
import { Download, Loader2, Eye } from "lucide-react";
import { toast } from 'sonner';

interface TaskAttachmentListProps {
  attachments: TaskAttachment[];
}

const TaskAttachmentList = ({ attachments }: TaskAttachmentListProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, file: TaskAttachment) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloadingId(file.id);
    try {
      const response = await fetch(file.file_url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Download failed:", error);
      toast.error("Download failed", { description: error.message });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = (e: React.MouseEvent, file: TaskAttachment) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(file.file_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {attachments.map((file) => (
        <li key={file.id} className="flex items-center justify-between p-2 rounded-md border bg-background">
          <div className="flex items-center gap-3 truncate flex-1">
            <FileIcon fileType={file.file_type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="truncate">
              <p className="truncate text-sm font-medium" title={file.file_name}>{file.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => handleView(e, file)}
              title="View file"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => handleDownload(e, file)}
              disabled={downloadingId === file.id}
              title="Download file"
            >
              {downloadingId === file.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskAttachmentList;