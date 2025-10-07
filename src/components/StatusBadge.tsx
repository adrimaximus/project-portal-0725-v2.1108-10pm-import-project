import { Badge } from "@/components/ui/badge";
import { getStatusStyles, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) {
    return null;
  }

  const styles = getStatusStyles(status);
  return (
    <Badge className={cn(styles.className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;