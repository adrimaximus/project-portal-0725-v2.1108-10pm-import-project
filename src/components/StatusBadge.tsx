import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Project } from "@/data/projects";

const getStatusBadgeClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
    case 'Requested':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface StatusBadgeProps {
  status: Project['status'];
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <Badge variant="outline" className={cn("border-transparent", getStatusBadgeClass(status), className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;