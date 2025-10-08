import { GoalCompletion } from '@/types';
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
  completions: GoalCompletion[];
  unit?: string;
}

const GoalLogTable = ({ completions, unit }: GoalLogTableProps) => {
  const groupedCompletions = completions.reduce((acc, completion) => {
    const date = format(new Date(completion.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, GoalCompletion[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedCompletions).map(([date, logs]) => (
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
              {logs.map(log => {
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