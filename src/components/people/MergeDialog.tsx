import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Person } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, User as UserIcon, BrainCircuit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person1: Person;
  person2: Person;
}

const MergeDialog = ({ open, onOpenChange, person1, person2 }: MergeDialogProps) => {
  const [primaryId, setPrimaryId] = useState(person1.id);
  const [isMerging, setIsMerging] = useState(false);
  const queryClient = useQueryClient();

  const { primary, secondary } = useMemo(() => ({
    primary: primaryId === person1.id ? person1 : person2,
    secondary: primaryId === person1.id ? person2 : person1,
  }), [primaryId, person1, person2]);

  const { data: mergedPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['mergePreview', primary.id, secondary.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('preview-contact-merge', {
        body: {
          primary_person_id: primary.id,
          secondary_person_id: secondary.id,
        }
      });
      if (error) throw error;
      return data as Person;
    },
    enabled: open,
    staleTime: Infinity, // Don't refetch unless keys change
    gcTime: 300000, // 5 minutes
  });

  const handleMerge = async () => {
    setIsMerging(true);
    const { error } = await supabase.functions.invoke('contact-duplicate-handler', {
      body: {
        primary_person_id: primary.id,
        secondary_person_id: secondary.id,
      }
    });
    setIsMerging(false);

    if (error) {
      toast.error("Failed to merge contacts.", { description: error.message });
    } else {
      toast.success("Contacts merged successfully!");
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      onOpenChange(false);
    }
  };

  const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    value ? <div className="text-xs"><span className="font-semibold">{label}:</span> {value}</div> : null
  );

  const PersonCard = ({ person, isPrimary }: { person: Person, isPrimary: boolean }) => (
    <Card className={isPrimary ? 'border-primary' : ''}>
      <CardHeader className="p-3">
        <div className="flex items-center gap-2">
          <RadioGroupItem value={person.id} id={`r-${person.id}`} />
          <Avatar className="h-8 w-8"><AvatarImage src={person.avatar_url} /><AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback></Avatar>
          <Label htmlFor={`r-${person.id}`} className="font-bold cursor-pointer">{person.full_name}</Label>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1">
        <DetailRow label="Job" value={person.job_title} />
        <DetailRow label="Company" value={person.company} />
        <DetailRow label="Email" value={person.contact?.emails?.join(', ')} />
        <DetailRow label="Phone" value={person.contact?.phones?.join(', ')} />
      </CardContent>
    </Card>
  );

  const MergedPreviewCard = () => {
    if (isLoadingPreview || !mergedPreview) {
      return (
        <Card className="bg-muted/50">
          <CardHeader className="p-3 flex flex-row items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">AI Merge Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="bg-muted/50">
        <CardHeader className="p-3 flex flex-row items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">AI Merge Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1">
          <DetailRow label="Name" value={mergedPreview.full_name} />
          <DetailRow label="Job" value={mergedPreview.job_title} />
          <DetailRow label="Company" value={mergedPreview.company} />
          <DetailRow label="Email" value={mergedPreview.contact?.emails?.join(', ')} />
          <DetailRow label="Phone" value={mergedPreview.contact?.phones?.join(', ')} />
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review & Merge Contacts</DialogTitle>
          <DialogDescription>Select the primary contact to keep. The AI will merge the information, and the other contact will be deleted.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={primaryId} onValueChange={setPrimaryId} className="grid grid-cols-3 gap-4 items-start">
          <PersonCard person={person1} isPrimary={primaryId === person1.id} />
          <PersonCard person={person2} isPrimary={primaryId === person2.id} />
          <MergedPreviewCard />
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMerge} disabled={isMerging || isLoadingPreview}>
            {isMerging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeDialog;