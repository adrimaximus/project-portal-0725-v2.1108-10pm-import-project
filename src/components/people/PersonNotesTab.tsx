import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface PersonNotesTabProps {
  notes: Person['notes'];
}

const PersonNotesTab = ({ notes }: PersonNotesTabProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {notes || 'No notes for this contact.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default PersonNotesTab;