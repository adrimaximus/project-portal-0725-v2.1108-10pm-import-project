import { Goal, GoalCompletion } from '@/data/goals';
import { allUsers } from '@/data/users';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { formatNumber, formatValue } from '@/lib/formatting';

interface GoalLogTableProps {
  goal: Goal;
}

const GoalLogTable = ({ goal }: GoalLogTableProps) => {
  const formatDisplayValue = (value: number) => {
    return goal.type === 'value' ? formatValue(value, goal.unit) : formatNumber(value);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Contributor</TableHead>
          <TableHead className="text-right">Contribution</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goal.completions.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              No progress logged yet.
            </TableCell>
          </TableRow>
        )}
        {goal.completions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((completion: GoalCompletion) => {
            const user = allUsers.find(u => u.id === completion.userId);
            return (
              <TableRow key={completion.id}>
                <TableCell>{format(new Date(completion.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>{user?.initials}</AvatarFallback>
                    </Avatar>
                    <span>{user?.name || 'Unknown User'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatDisplayValue(completion.value)}
                </TableCell>
              </TableRow>
            );
        })}
      </TableBody>
    </Table>
  );
};

export default GoalLogTable;