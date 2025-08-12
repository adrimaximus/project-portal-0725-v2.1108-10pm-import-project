import { cn, getStatusStyles } from "@/lib/utils";
import { ProjectStatus, PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: ProjectStatus | PaymentStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) {
    return null;
  }
  const styles = getStatusStyles(status);
  return (
    <Badge variant="outline" className={cn("border-transparent", styles.tw)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;