import {
  MessageSquare,
  ListChecks,
  Ticket,
  FileUp,
  UserPlus,
  PlusCircle,
  MessageSquareOff,
  UserMinus,
  MinusCircle,
  CheckCircle2,
  Undo2,
  Pencil,
  Flag,
  CreditCard,
  DollarSign,
  Calendar,
  MapPin,
  UserCog,
  Activity as DefaultActivityIcon,
} from 'lucide-react';
import { ProjectActivity } from '@/hooks/useActivities';

interface ActivityIconProps {
  type: ProjectActivity['type'];
  className?: string;
}

const iconMap: { [key: string]: React.ElementType } = {
  COMMENT_ADDED: MessageSquare,
  TASK_CREATED: ListChecks,
  TICKET_CREATED: Ticket,
  FILE_UPLOADED: FileUp,
  TEAM_MEMBER_ADDED: UserPlus,
  SERVICE_ADDED: PlusCircle,
  COMMENT_DELETED: MessageSquareOff,
  TICKET_DELETED: Ticket,
  TEAM_MEMBER_REMOVED: UserMinus,
  SERVICE_REMOVED: MinusCircle,
  TASK_COMPLETED: CheckCircle2,
  TASK_REOPENED: Undo2,
  PROJECT_DETAILS_UPDATED: Pencil,
  PROJECT_STATUS_UPDATED: Flag,
  PAYMENT_STATUS_UPDATED: CreditCard,
  BUDGET_UPDATED: DollarSign,
  TIMELINE_UPDATED: Calendar,
  VENUE_UPDATED: MapPin,
  OWNERSHIP_TRANSFERRED: UserCog,
};

const ActivityIcon = ({ type, className }: ActivityIconProps) => {
  const IconComponent = iconMap[type] || DefaultActivityIcon;
  return <IconComponent className={className} />;
};

export default ActivityIcon;