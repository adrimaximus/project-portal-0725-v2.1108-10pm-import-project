import { Goal } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GoalLogTableProps {
  goal: Goal;
}

const GoalLogTable = ({ goal }: GoalLogTableProps) => {
  const logs = goal.completions || [];

  const getAchiever = (userId: string) => {
    return goal.collaborators?.find(c => c.id === userId);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Achiever</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
              const achiever = getAchiever(log.userId);
              return (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {achiever && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getAvatarUrl(achiever)} />
                              <AvatarFallback style={generatePastelColor(achiever.id)}>{achiever.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{achiever.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{log.value} {goal.unit}</TableCell>
                  <TableCell>{log.notes}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GoalLogTable;