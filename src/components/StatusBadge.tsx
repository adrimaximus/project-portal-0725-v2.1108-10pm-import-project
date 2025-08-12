import { cn, getStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
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