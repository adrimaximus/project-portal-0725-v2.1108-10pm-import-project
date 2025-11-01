import { cn, getProjectStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_STATUS_OPTIONS, ProjectStatus } from "@/types";

interface StatusBadgeProps {
  status: string;
  onStatusChange?: (newStatus: ProjectStatus) => void;
}

const StatusBadge = ({ status, onStatusChange }: StatusBadgeProps) => {
  if (!status) {
    return null;
  }
  const styles = getProjectStatusStyles(status);

  if (onStatusChange) {
    return (
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
          <SelectValue>
            <Badge className={cn(styles.tw)}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PROJECT_STATUS_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge className={cn(styles.tw)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;