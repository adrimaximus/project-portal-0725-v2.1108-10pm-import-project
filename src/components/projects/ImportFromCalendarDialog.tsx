import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ImportFromCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  isImporting?: boolean;
  onImport?: (events: any[]) => void;
}

export const GoogleCalendarImportDialog = ({ isOpen, onClose }: ImportFromCalendarDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Calendar</DialogTitle>
          <DialogDescription>
            This feature is not yet fully implemented.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};