import { TaskAttachment } from "@/types/task";
import FileIcon from "../FileIcon";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Download } from "lucide-react";

interface TaskAttachmentListProps {
  attachments: TaskAttachment[];
}

const TaskAttachmentList = ({ attachments }: TaskAttachmentListProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Attachments ({attachments.length})</DialogTitle>
      </DialogHeader>
      <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {attachments.map((file) => (
          <li key={file.id} className="flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted transition-colors">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 truncate flex-1"
            >
              <FileIcon fileType={file.file_type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="truncate">
                <p className="truncate text-sm font-medium">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : ''}
                </p>
              </div>
            </a>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default TaskAttachmentList;