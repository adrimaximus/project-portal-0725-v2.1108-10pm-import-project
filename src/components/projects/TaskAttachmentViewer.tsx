import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskAttachment } from "@/types/task";
import FileIcon from "../FileIcon";

interface TaskAttachmentViewerProps {
  attachments: TaskAttachment[];
  trigger: React.ReactNode;
}

const TaskAttachmentViewer = ({ attachments, trigger }: TaskAttachmentViewerProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attachments ({attachments.length})</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {attachments.map((file) => (
            <li key={file.id}>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <FileIcon fileType={file.file_type || ''} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="truncate">
                    <p className="truncate text-sm font-medium">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : ''}
                    </p>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default TaskAttachmentViewer;