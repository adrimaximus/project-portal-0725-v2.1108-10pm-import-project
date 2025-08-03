import { Goal, GoalCompletion } from "@/data/goals";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface GoalLogTableProps {
  goal: Goal;
}

export function GoalLogTable({ goal }: GoalLogTableProps) {
  const getCompletionText = (completion: GoalCompletion) => {
    if (goal.type === 'value' && completion.value) {
      return `Logged ${completion.value.toLocaleString()} ${goal.unit || ''}`;
    }
    if (goal.type === 'quantity') {
      return `Completed 1 item`;
    }
    return "Completed";
  };

  const sortedCompletions = [...goal.completions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompletions.map(completion => {
            const collaborator = goal.collaborators.find(c => c.id === completion.collaboratorId);
            return (
              <TableRow key={completion.id}>
                <TableCell className="font-medium">{getCompletionText(completion)}</TableCell>
                <TableCell>
                  {collaborator ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>{collaborator.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{collaborator.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">System</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(completion.date), { addSuffix: true })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}