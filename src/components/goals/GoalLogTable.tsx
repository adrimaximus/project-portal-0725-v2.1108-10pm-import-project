import { GoalCompletion, User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GoalLogTableProps {
  logs: (GoalCompletion & { user: User })[];
  goalType: string;
  unit?: string;
}

const GoalLogTable = ({ logs, goalType, unit }: GoalLogTableProps) => {
  const groupedCompletions = logs.reduce((acc, completion) => {
    const date = format(new Date(completion.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, (GoalCompletion & { user: User })[]>);

  return (
    <div className="space-y-4 mt-4">
      {Object.entries(groupedCompletions).map(([date, logsForDate]) => (
        <div key={date}>
          <h4 className="font-semibold text-sm mb-2">{format(new Date(date), 'MMMM d, yyyy')}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Achiever</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsForDate.map(log => {
                const achiever = log.user;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getAvatarUrl(achiever.avatar_url) || undefined} />
                              <AvatarFallback style={{ backgroundColor: generatePastelColor(achiever.id) }}>{achiever.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>{achiever.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">{log.value} {unit}</TableCell>
                    <TableCell>{log.notes}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default GoalLogTable;