import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Download, Loader2 } from 'lucide-react';
import CommentAttachmentItem from './CommentAttachmentItem';
import { TaskAttachment } from '@/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface AttachmentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: TaskAttachment[];
  commentId: string;
}

const AttachmentViewerModal = ({ open, onOpenChange, attachments, commentId }: AttachmentViewerModalProps) => {
  const [isBundling, setIsBundling] = useState(false);

  const handleDownloadAll = async () => {
    setIsBundling(true);
    const toastId = toast.loading(`Bundling ${attachments.length} files...`);

    try {
      const zip = new JSZip();
      
      const filePromises = attachments.map(async (file) => {
        const response = await fetch(file.file_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${file.file_name}`);
        }
        const blob = await response.blob();
        zip.file(file.file_name, blob);
      });

      await Promise.all(filePromises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `attachments-${commentId.substring(0, 8)}.zip`);
      toast.success("Download started!", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to create bundle.", { id: toastId, description: error.message });
    } finally {
      setIsBundling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Attachments ({attachments.length})</DialogTitle>
            {attachments.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleDownloadAll} disabled={isBundling}>
                {isBundling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download All
              </Button>
            )}
          </div>
          <DialogDescription>
            View and download the files attached to this comment.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-2 py-4">
            {attachments.map((file, index) => (
              <CommentAttachmentItem key={file.id || index} file={file} />
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerModal;