import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GitMerge, Users } from 'lucide-react';
import { DuplicatePair } from './DuplicateContactsCard';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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
            We found {duplicates.length} potential duplicate(s) based on strict matching rules.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 border rounded-md p-2">
          <div className="space-y-2">
            {duplicates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                No duplicates found. Your contact list looks clean!
              </div>
            ) : (
              duplicates.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border"><AvatarImage src={pair.person1.avatar_url} /><AvatarFallback><Users className="h-4 w-4" /></AvatarFallback></Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{pair.person1.full_name}</p>
                        <span className="text-muted-foreground text-xs">&</span>
                        <p className="font-semibold text-sm">{pair.person2.full_name}</p>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-5 font-normal text-muted-foreground">
                          {pair.match_reason || 'Potential Match'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="default" onClick={() => onSelectPair(pair)}>
                    <GitMerge className="mr-2 h-3.5 w-3.5" />
                    Review
                  </Button>
                </div>
              ))
            )}
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