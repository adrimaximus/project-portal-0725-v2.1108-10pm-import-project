import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { getStatusBadgeStyle } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StatusBadgeProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  hasOpenTasks?: boolean;
  className?: string;
  projectId?: string;
}

const StatusBadge = ({ status, onStatusChange, hasOpenTasks, className, projectId }: StatusBadgeProps) => {
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

  const handleStatusChange = async (newStatus: string) => {
    // Optimistic update
    setLocalStatus(newStatus);
    
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else if (projectId) {
      try {
        const { error } = await supabase.rpc('update_project_status', {
          p_project_id: projectId,
          p_new_status: newStatus
        });
        
        if (error) throw error;
        toast.success(`Status updated to ${newStatus}`);
      } catch (error: any) {
        console.error("Error updating status:", error);
        toast.error(error.message || "Failed to update status");
        // Revert on error
        setLocalStatus(status);
      }
    }
  };

  // Component is editable if a handler is provided OR if a projectId is provided (for self-update)
  const isEditable = !!onStatusChange || !!projectId;

  if (isEditable) {
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