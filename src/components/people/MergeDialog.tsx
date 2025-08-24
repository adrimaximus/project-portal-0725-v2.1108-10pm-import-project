import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Person } from '@/pages/PeoplePage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, User as UserIcon } from 'lucide-react';

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

  const mergedPreview = useMemo(() => {
    const combined: Partial<Person> = { ...primary };
    
    const emails = [...new Set([...(primary.contact?.emails || []), ...(secondary.contact?.emails || [])])];
    const phones = [...new Set([...(primary.contact?.phones || []), ...(secondary.contact?.phones || [])])];
    combined.contact = { emails, phones };

    combined.social_media = { ...secondary.social_media, ...primary.social_media };
    
    const allTags = [...(primary.tags || []), ...(secondary.tags || [])];
    combined.tags = Array.from(new Map(allTags.map(tag => [tag.id, tag])).values());

    const allProjects = [...(primary.projects || []), ...(secondary.projects || [])];
    combined.projects = Array.from(new Map(allProjects.map(proj => [proj.id, proj])).values());

    if (primary.notes && secondary.notes && primary.notes !== secondary.notes) {
      combined.notes = `${primary.notes}\n\n--- Merged Notes ---\n${secondary.notes}`;
    } else {
      combined.notes = primary.notes || secondary.notes;
    }

    return combined as Person;
  }, [primary, secondary]);

  const handleMerge = async () => {
    setIsMerging(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Authentication error. Please log in again.");
      setIsMerging(false);
      return;
    }

    const { error } = await supabase.functions.invoke('contact-duplicate-handler', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review & Merge Contacts</DialogTitle>
          <DialogDescription>Select the primary contact to keep, and we'll merge the information. The other contact will be deleted.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={primaryId} onValueChange={setPrimaryId} className="grid grid-cols-3 gap-4 items-start">
          <PersonCard person={person1} isPrimary={primaryId === person1.id} />
          <PersonCard person={person2} isPrimary={primaryId === person2.id} />
          <Card className="bg-muted/50">
            <CardHeader className="p-3">
              <CardTitle className="text-base">Merged Result</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              <DetailRow label="Name" value={mergedPreview.full_name} />
              <DetailRow label="Job" value={mergedPreview.job_title} />
              <DetailRow label="Company" value={mergedPreview.company} />
              <DetailRow label="Email" value={mergedPreview.contact?.emails?.join(', ')} />
              <DetailRow label="Phone" value={mergedPreview.contact?.phones?.join(', ')} />
            </CardContent>
          </Card>
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMerge} disabled={isMerging}>
            {isMerging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeDialog;