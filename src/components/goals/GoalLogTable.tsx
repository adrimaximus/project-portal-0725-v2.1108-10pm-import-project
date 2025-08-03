import { Completion } from '@/data/goals';
import { format } from 'date-fns';
import { formatValue, formatNumber } from '@/lib/formatting';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface GoalLogTableProps {
  logs: Completion[];
  unit: string | null;
  goalType: 'quantity' | 'value' | 'frequency';
}

const GoalLogTable = ({ logs, unit, goalType }: GoalLogTableProps) => {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">No activities logged for this period yet.</p>;
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-semibold mb-2 text-sm">Recent Activity</h4>
      <div className="max-h-60 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Date</TableHead>
              {goalType !== 'frequency' && <TableHead className="text-right font-medium">Amount</TableHead>}
              <TableHead className="font-medium">Achiever</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map((log, index) => (
              <TableRow key={index}>
                <TableCell className="text-sm">{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                {goalType !== 'frequency' && (
                  <TableCell className="text-right font-medium text-sm">
                    {goalType === 'value' ? formatValue(log.value, unit) : formatNumber(log.value)}
                  </TableCell>
                )}
                <TableCell className="text-sm">{log.achiever}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GoalLogTable;