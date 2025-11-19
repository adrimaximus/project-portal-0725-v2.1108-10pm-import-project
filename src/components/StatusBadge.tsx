import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { getStatusBadgeStyle } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

interface StatusBadgeProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  hasOpenTasks?: boolean;
  className?: string;
}

const StatusBadge = ({ status, onStatusChange, hasOpenTasks, className }: StatusBadgeProps) => {
  const [localStatus, setLocalStatus] = useState(status);
  const { data: statuses = [] } = useProjectStatuses();
  const theme = useResolvedTheme();

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  if (!localStatus) {
    return null;
  }

  // Find the color definition from the DB statuses
  const statusDef = statuses.find(s => s.name === localStatus);
  // Default fallback color if not found in DB (slate-400)
  const baseColor = statusDef?.color || '#94a3b8'; 
  
  const badgeStyle = getStatusBadgeStyle(baseColor, theme);

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  if (onStatusChange) {
    return (
      <Select value={localStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className={cn("h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none", className)}>
          <SelectValue>
            <Badge 
              className="hover:opacity-90 transition-opacity border font-medium px-2.5 py-0.5"
              style={badgeStyle}
            >
              {localStatus}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.length > 0 ? (
            statuses.map(option => {
                const optionStyle = getStatusBadgeStyle(option.color, theme);
                return (
                    <SelectItem 
                        key={option.id} 
                        value={option.name}
                        disabled={option.name === 'Completed' && hasOpenTasks}
                    >
                        <div className="flex items-center gap-2">
                        <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: optionStyle.color }}
                        />
                        {option.name}
                        </div>
                    </SelectItem>
                );
            })
          ) : (
            <SelectItem value={localStatus}>{localStatus}</SelectItem>
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      className={cn("border font-medium px-2.5 py-0.5", className)}
      style={badgeStyle}
    >
      {localStatus}
    </Badge>
  );
};

export default StatusBadge;