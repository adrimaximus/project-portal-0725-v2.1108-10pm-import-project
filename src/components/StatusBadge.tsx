import { useState, useEffect } from 'react';
import { cn, getProjectStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_STATUS_OPTIONS, ProjectStatus } from "@/types";

interface StatusBadgeProps {
  status: ProjectStatus;
  onStatusChange?: (newStatus: ProjectStatus) => void;
  hasOpenTasks?: boolean;
}

const StatusBadge = ({ status, onStatusChange, hasOpenTasks }: StatusBadgeProps) => {
  const [localStatus, setLocalStatus] = useState(status);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  if (!localStatus) {
    return null;
  }
  const styles = getProjectStatusStyles(localStatus);

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setLocalStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  if (onStatusChange) {
    return (
      <Select value={localStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
          <SelectValue>
            <Badge className={cn(styles.tw)}>
              {localStatus}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PROJECT_STATUS_OPTIONS.map(option => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.value === 'Completed' && hasOpenTasks}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge className={cn(styles.tw)}>
      {localStatus}
    </Badge>
  );
};

export default StatusBadge;