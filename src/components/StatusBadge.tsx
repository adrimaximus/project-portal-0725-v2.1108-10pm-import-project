import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusStyles: Record<ProjectStatus, { bg: string; text: string }> = {
    "On Track": { bg: "bg-green-100", text: "text-green-800" },
    "At Risk": { bg: "bg-yellow-100", text: "text-yellow-800" },
    "Off Track": { bg: "bg-red-100", text: "text-red-800" },
    "On Hold": { bg: "bg-gray-100", text: "text-gray-800" },
    "Completed": { bg: "bg-blue-100", text: "text-blue-800" },
    "In Progress": { bg: "bg-purple-100", text: "text-purple-800" },
    "Requested": { bg: "bg-orange-100", text: "text-orange-800" },
    "Done": { bg: "bg-blue-100", text: "text-blue-800" },
    "Cancelled": { bg: "bg-red-100", text: "text-red-800" },
    "Billed": { bg: "bg-indigo-100", text: "text-indigo-800" },
    "Proposed": { bg: "bg-cyan-100", text: "text-cyan-800" },
    "Approved": { bg: "bg-teal-100", text: "text-teal-800" },
    "PO Created": { bg: "bg-lime-100", text: "text-lime-800" },
    "On Process": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
    "Pending": { bg: "bg-amber-100", text: "text-amber-800" },
    "Paid": { bg: "bg-emerald-100", text: "text-emerald-800" },
    "Overdue": { bg: "bg-rose-100", text: "text-rose-800" },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const styles = statusStyles[status] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <Badge variant="outline" className={cn("border-transparent dark:border-transparent", styles.bg, styles.text, className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;