import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, GitMerge } from 'lucide-react';
import { Person } from '@/types';
import MergeDialog from './MergeDialog';

export type DuplicatePair = {
  person1: Person;
  person2: Person;
  reason: string;
};

interface DuplicateContactsCardProps {
  duplicates: DuplicatePair[];
}

const DuplicateContactsCard = ({ duplicates }: DuplicateContactsCardProps) => {
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null);

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-900">Potential Duplicates Found</CardTitle>
              <CardDescription className="text-amber-700">
                We found {duplicates.length} potential duplicate contact{duplicates.length > 1 ? 's' : ''}. Review them to keep your data clean.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {duplicates.map((pair, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-background border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarImage src={pair.person1.avatar_url} /><AvatarFallback><Users className="h-4 w-4" /></AvatarFallback></Avatar>
                <div>
                  <p className="font-medium text-sm">{pair.person1.full_name}</p>
                  <p className="text-xs text-muted-foreground">may be a duplicate of</p>
                  <p className="font-medium text-sm">{pair.person2.full_name}</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setSelectedPair(pair)}>
                <GitMerge className="mr-2 h-4 w-4" />
                Review & Merge
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      {selectedPair && (
        <MergeDialog
          open={!!selectedPair}
          onOpenChange={() => setSelectedPair(null)}
          person1={selectedPair.person1}
          person2={selectedPair.person2}
        />
      )}
    </>
  );
};

export default DuplicateContactsCard;