import { Badge } from "@/components/ui/badge";
import { differenceInDays, isBefore, isAfter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  startDate: string;
  endDate: string;
}

const ProjectStatusBadge = ({ startDate, endDate }: ProjectStatusBadgeProps) => {
  const now = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let text: string;
  let className: string;

  if (isBefore(now, start)) {
    const daysUntilStart = differenceInDays(start, now) + 1;
    text = `Upcoming in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
    className = 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent';
  } else if (isAfter(now, end)) {
    text = 'Done';
    className = 'bg-green-100 text-green-800 hover:bg-green-200 border-transparent';
  } else {
    text = 'Ongoing';
    className = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent';
  }

  return <Badge className={cn(className)}>{text}</Badge>;
};

export default ProjectStatusBadge;