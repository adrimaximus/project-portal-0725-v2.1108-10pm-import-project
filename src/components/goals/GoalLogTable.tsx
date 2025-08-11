import { Goal, GoalCompletion, User } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoalLogTableProps {
  goal: Goal;
  onCompletionDeleted: (completionId: string) => void;
}

export default function GoalLogTable({ goal, onCompletionDeleted }: GoalLogTableProps) {
  const [collaboratorDetails, setCollaboratorDetails] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    const detailsMap = new Map<string, User>();
    goal.collaborators.forEach(c => {
      detailsMap.set(c.id, c);
    });
    setCollaboratorDetails(detailsMap);
  }, [goal.collaborators]);

  const handleDelete = async (completionId: string) => {
    const { error } = await supabase.from('goal_completions').delete().eq('id', completionId);
    if (error) {
      toast.error(`Failed to delete log: ${error.message}`);
    } else {
      toast.success("Log entry deleted.");
      onCompletionDeleted(completionId);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goal.completions.map(comp => {
          const user = collaboratorDetails.get(comp.userId);
          return (
            <TableRow key={comp.id}>
              <TableCell>{format(new Date(comp.date), 'PPP')}</TableCell>
              <TableCell>
                {user && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>{comp.value}</TableCell>
              <TableCell>{comp.notes}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(comp.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}