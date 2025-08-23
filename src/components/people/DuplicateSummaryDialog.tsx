import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GitMerge, Users } from 'lucide-react';
import { DuplicatePair } from './DuplicateContactsCard';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface DuplicateSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  duplicates: DuplicatePair[];
  onSelectPair: (pair: DuplicatePair) => void;
}

const DuplicateSummaryDialog = ({ open, onOpenChange, summary, duplicates, onSelectPair }: DuplicateSummaryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Duplicate Analysis Complete</DialogTitle>
          <DialogDescription>
            Our AI agent has analyzed your contacts. Here's the summary and recommended actions.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
        <ScrollArea className="h-64 border rounded-md p-2">
          <div className="space-y-2">
            {duplicates.map((pair, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarImage src={pair.person1.avatar_url} /><AvatarFallback><Users className="h-4 w-4" /></AvatarFallback></Avatar>
                  <div>
                    <p className="font-medium text-sm">{pair.person1.full_name}</p>
                    <p className="text-xs text-muted-foreground">matches</p>
                    <p className="font-medium text-sm">{pair.person2.full_name}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onSelectPair(pair)}>
                  <GitMerge className="mr-2 h-4 w-4" />
                  Review
                </Button>
              </div>
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

export default DuplicateSummaryDialog;