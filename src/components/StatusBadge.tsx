import { cn, getProjectStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) {
    return null;
  }
  const styles = getProjectStatusStyles(status);
  return (
    <Badge className={cn(styles.tw)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;