import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Project } from "@/data/projects";
import { getStatusStyles } from "@/lib/utils";

interface StatusBadgeProps {
  status: Project['status'] | Project['paymentStatus'];
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const styles = getStatusStyles(status);
  return (
    <Badge variant="outline" className={cn("border-transparent", styles.bg, styles.text, className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;