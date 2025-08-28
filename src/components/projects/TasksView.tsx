import { Task, TaskAssignee } from "@/types/task";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateVibrantGradient } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TasksViewProps {
  tasks: Task[];
  isLoading: boolean;
}

const getInitials = (user: TaskAssignee) => {
    const firstNameInitial = user.first_name?.[0] || '';
    const lastNameInitial = user.last_name?.[0] || '';
    if (firstNameInitial && lastNameInitial) {
        return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase();
}

const TasksView = ({ tasks, isLoading }: TasksViewProps) => {
  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No tasks found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Task</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignees</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>
              {task.projects ? (
                <Link to={`/projects/${task.projects.slug}`} className="hover:underline text-primary">
                  {task.projects.name}
                </Link>
              ) : (
                'N/A'
              )}
            </TableCell>
            <TableCell>
              {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : <span className="text-muted-foreground">No due date</span>}
            </TableCell>
            <TableCell>
              <div className="flex items-center -space-x-2">
                {(task.assignees || []).map((user) => (
                  <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback style={generateVibrantGradient(user.id)}>
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={task.completed ? "outline" : "default"}>
                {task.completed ? "Completed" : "Open"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TasksView;